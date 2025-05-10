from flask import Flask, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from werkzeug.utils import secure_filename
import logging
from flask_cors import CORS
import tempfile
import textwrap
import re
import ast
import datetime
import atexit
import time
from functools import lru_cache
import uuid
from pymongo import MongoClient

# Configuration
load_dotenv()
app = Flask(__name__)

# Enhanced CORS Configuration
CORS(app, resources={
    r"/threads*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    },
    r"/process-pdf": {
        "origins": ["http://localhost:3000"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})


app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 10MB file size limit

# Gemini Setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash-latest')

# Enable logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Temp file cleanup registry
_temp_files = []
atexit.register(lambda: [cleanup_file(f) for f in _temp_files])

@lru_cache(maxsize=5)
def extract_text_from_pdf(filepath, page_range):
    """Extract text from PDF with caching."""
    with open(filepath, 'rb') as f:
        reader = PdfReader(f)
        if page_range == 'all':
            pages = reader.pages
        else:
            start, end = map(int, page_range.split('-'))
            pages = reader.pages[start-1:end]
        return "\n".join([page.extract_text() or "" for page in pages])

def cleanup_file(filepath):
    """Safely remove temp files."""
    try:
        if filepath and os.path.exists(filepath):
            os.unlink(filepath)
            if filepath in _temp_files:
                _temp_files.remove(filepath)
    except Exception as e:
        logging.warning(f"Failed to delete {filepath}: {str(e)}")


@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    tmp_path = None
    try:
        # File validation
        if 'pdf' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['pdf']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Validate file extension
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF files are allowed"}), 400

        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp_path = tmp.name
            _temp_files.append(tmp_path)
            file.save(tmp_path)
            tmp.close()  # Explicitly close the file handle

        # Verify file was written
        if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
            return jsonify({"error": "Failed to save PDF file"}), 400

        # Read PDF content
        text = ""
        with open(tmp_path, 'rb') as f:
            reader = PdfReader(f)
            pages = reader.pages
            
            # Get page range
            page_range = request.form.get('page_range', 'all')
            if page_range != 'all':
                try:
                    start, end = map(int, page_range.split('-'))
                    pages = pages[start-1:end]
                except ValueError:
                    return jsonify({"error": "Invalid page range format. Use '1-5'"}), 400
            
            text = "\n".join([page.extract_text() or "" for page in pages])

        # Validate parameters
        try:
            num_questions = int(request.form.get('num_questions', 5))
            question_type = request.form.get('question_type', 'MCQ')
            if question_type not in ['MCQ', 'Subjective']:
                raise ValueError
        except ValueError:
            return jsonify({"error": "Invalid question parameters"}), 400
        
        # Generate questions - UPDATED PROMPT
        prompt = textwrap.dedent(f"""
        Generate {num_questions} {question_type} questions from this text:
        {text[:20000]}
        
        Requirements:
        {"- Include exactly 4 options per question" if question_type == "MCQ" else "- Provide detailed model answers"}
        {"- Mark exactly ONE correct answer with (Correct) for each question" if question_type == "MCQ" else ""}
        - Format each question with Q1, Q2, etc.
        {"- Use EXACTLY this format for MCQs:" if question_type == "MCQ" else ""}
        {"  Q1) Question text?" if question_type == "MCQ" else ""}
        {"  A) Option 1" if question_type == "MCQ" else ""}
        {"  B) Option 2 (Correct)" if question_type == "MCQ" else ""}
        {"  C) Option 3" if question_type == "MCQ" else ""}
        {"  D) Option 4" if question_type == "MCQ" else ""}
        {"- VERY IMPORTANT: Only mark ONE option as (Correct) per question" if question_type == "MCQ" else ""}
        
        {"For subjective questions use:" if question_type == "Subjective" else ""}
        {"Q1) Question text?" if question_type == "Subjective" else ""}
        {"Model Answer: Detailed explanation..." if question_type == "Subjective" else ""}
        """)
        
        response = model.generate_content(prompt)
        questions = response.text  # Remove format_questions call
        
        return jsonify({
            "questions": questions,
            "text": text[:1000],  # Return first 1000 chars for reference
            "metadata": {
                "pages_processed": len(page_range.split('-')) if page_range != 'all' else 'all',
                "word_count": len(text.split()),
                "filename": secure_filename(file.filename)
            }
        })
        
    except Exception as e:
        logger.error(f"PDF processing error: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to process PDF"}), 500
    finally:
        if tmp_path:
            cleanup_file(tmp_path)

@app.route('/evaluate-answer', methods=['POST'])
def evaluate_answer():
    try:
        data = request.get_json()
        if not data or 'student_answer' not in data or 'model_answer' not in data:
            return jsonify({"error": "Missing required fields"}), 400
            
        prompt = f"""
        Evaluate this student answer: {data['student_answer']}
        Against this model answer: {data['model_answer']}
        
        Provide:
        1. Score (0-100)
        2. Detailed feedback
        3. Key missed points
        4. Suggestions for improvement
        
        Return as valid JSON with these keys: score, feedback, missed_points, suggestions
        """
        
        response = model.generate_content(prompt)
        evaluation = parse_json_response(response.text)
        evaluation['timestamp'] = datetime.datetime.now().isoformat()
        
        return jsonify(evaluation)
        
    except Exception as e:
        logger.error(f"Evaluation error: {str(e)}", exc_info=True)
        return jsonify({
            "score": 0,
            "feedback": "Evaluation failed",
            "error": str(e),
            "timestamp": datetime.datetime.now().isoformat()
        }), 500

@app.route('/web-search', methods=['POST'])
def web_search():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({"error": "Empty query"}), 400
        if len(query) < 3:
            return jsonify({"error": "Query too short (min 3 chars)"}), 400
            
        prompt = f"Provide a comprehensive, academic answer to: {query}\n" \
                 "Include key concepts, examples, and sources if available."
                 
        response = model.generate_content(prompt, request_options={"timeout": 10})
        
        if not response.text:
            return jsonify({"error": "Empty response from AI"}), 500
            
        return jsonify({
            "answer": response.text,
            "query": query,
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"Web search error: {str(e)}", exc_info=True)
        return jsonify({"error": "Search failed"}), 500

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client['chat_forum']
threads_collection = db['threads']

@app.route('/threads', methods=['GET', 'POST', 'OPTIONS'])
def handle_threads():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

    if request.method == 'GET':
        try:
            threads = list(threads_collection.find({}, {"_id": 0}))
            return jsonify(threads)
        except Exception as e:
            logger.error(f"Failed to fetch threads: {str(e)}")
            return jsonify({"error": "Failed to fetch threads"}), 500

    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data or 'title' not in data or 'description' not in data:
                return jsonify({"error": "Missing title or description"}), 400

            new_thread = {
                "id": str(uuid.uuid4()),
                "title": data['title'].strip(),
                "description": data['description'].strip(),
                "messages": [],
                "created_at": datetime.datetime.utcnow().isoformat()
            }
            
            result = threads_collection.insert_one(new_thread)
            if result.inserted_id:
                return jsonify(new_thread), 201
            else:
                return jsonify({"error": "Failed to create thread"}), 500
                
        except Exception as e:
            logger.error(f"Failed to create thread: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

@app.route('/threads/<thread_id>', methods=['GET', 'DELETE', 'OPTIONS'])
def get_thread(thread_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
        
    try:
        if request.method == 'GET':
            thread = threads_collection.find_one({"id": thread_id}, {"_id": 0})
            if not thread:
                return jsonify({"error": "Thread not found"}), 404
            return jsonify(thread)
            
        elif request.method == 'DELETE':
            result = threads_collection.delete_one({"id": thread_id})
            if result.deleted_count == 0:
                return jsonify({"error": "Thread not found"}), 404
            return jsonify({"message": "Thread deleted successfully"}), 200
            
    except Exception as e:
        logger.error(f"Thread operation failed: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/threads/<thread_id>/messages', methods=['POST', 'OPTIONS'])
def add_message(thread_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
        
    try:
        data = request.get_json()
        if not data or 'text' not in data or 'sender' not in data:
            return jsonify({"error": "Missing text or sender"}), 400

        thread = threads_collection.find_one({"id": thread_id})
        if not thread:
            return jsonify({"error": "Thread not found"}), 404

        new_message = {
            "id": str(uuid.uuid4()),
            "text": data['text'].strip(),
            "sender": data['sender'].strip(),
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "pinned": False
        }
        
        result = threads_collection.update_one(
            {"id": thread_id},
            {"$push": {"messages": new_message}}
        )
        
        if result.modified_count == 1:
            return jsonify(new_message), 201
        else:
            return jsonify({"error": "Failed to add message"}), 500
            
    except Exception as e:
        logger.error(f"Failed to add message: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/threads/<thread_id>/messages/<message_id>/report', methods=['POST', 'OPTIONS'])
def report_message(thread_id, message_id):
    if request.method == 'OPTIONS':
        return ()
        
    try:
        thread = threads_collection.find_one({"id": thread_id})
        if not thread:
            return jsonify({"error": "Thread not found"}), 404

        message = next((m for m in thread['messages'] if m['id'] == message_id), None)
        if not message:
            return jsonify({"error": "Message not found"}), 404

        # Log the report
        logger.info(f"Message {message_id} in thread {thread_id} reported")
        return jsonify({"status": "Message reported"}), 200
        
    except Exception as e:
        logger.error(f"Failed to report message: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    
def _build_cors_preflight_response():
    response = jsonify({"message": "CORS preflight"})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

def parse_json_response(text):
    """Safely extract JSON from Gemini response"""
    try:
        # Find first { and last }
        start = text.find('{')
        end = text.rfind('}') + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON found in response")
            
        json_str = text[start:end]
        return ast.literal_eval(json_str)  # Safer than eval
        
    except Exception as e:
        logger.error(f"JSON parsing error: {str(e)}")
        return {
            "score": 0,
            "feedback": "Could not parse evaluation",
            "error": str(e),
            "original_response": text
        }

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)