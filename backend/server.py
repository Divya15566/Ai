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

# Configuration
load_dotenv()
app = Flask(__name__)
CORS(app , resources={
    r"/*": {
        "origins": "http://localhost:3000",
        "methods": ["GET", "POST", "OPTIONS"],  # Explicit methods
        "allow_headers": ["Content-Type"]}})  # Enable CORS for all routes
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB file size limit

# Gemini Setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    """Endpoint for processing PDFs and generating questions"""
    try:
        # File validation
        if 'pdf' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['pdf']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            file.save(tmp.name)
            try:
                reader = PdfReader(tmp.name)
                pages = reader.pages
                
                # Get page range (default: all pages)
                page_range = request.form.get('page_range', 'all')
                if page_range != 'all':
                    start, end = map(int, page_range.split('-'))
                    pages = pages[start-1:end]  # Convert to 0-based index
                
                text = "\n".join([page.extract_text() or "" for page in pages])
                
            finally:
                os.unlink(tmp.name)  # Clean up temp file

        # Validate parameters
        num_questions = int(request.form.get('num_questions', 5))
        question_type = request.form.get('question_type', 'MCQ')
        
        # Generate questions
        prompt = textwrap.dedent(f"""
        Generate {num_questions} {question_type} questions from this text:
        {text[:20000]}  # First 20k chars for context
        
        Requirements:
        {"- Include 4 options per question, mark correct answer with [CORRECT]" if question_type == "MCQ" else "- Provide detailed model answers"}
        - Format each question with Q1, Q2, etc.
        - For MCQs, format like:
          Q1) Question text?
          A) Option 1
          B) Option 2 [CORRECT]
          C) Option 3
          D) Option 4
        
        For subjective questions:
        Q1) Question text?
        Model Answer: Detailed explanation...
        """)
        
        response = model.generate_content(prompt)
        questions = format_questions(response.text, question_type)
        
        return jsonify({
            "questions": questions,
            "metadata": {
                "pages_processed": len(pages),
                "word_count": len(text.split())
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/evaluate-answer', methods=['POST'])
def evaluate_answer():
    """Evaluate student answers against model answers"""
    data = request.json
    prompt = f"""
    Evaluate this student answer: {data['student_answer']}
    Against this model answer: {data['model_answer']}
    
    Provide:
    1. Score (0-100)
    2. Detailed feedback
    3. Key missed points
    4. Suggestions for improvement
    
    Format as JSON with these keys: score, feedback, missed_points, suggestions
    """
    
    response = model.generate_content(prompt)
    try:
        evaluation = parse_json_response(response.text)
        return jsonify(evaluation)
    except:
        return jsonify({
            "score": 0,
            "feedback": "Evaluation failed",
            "model_response": response.text
        }), 500

@app.route('/summarize', methods=['POST'])
def summarize():
    """Generate PDF summary"""
    text = request.json.get('text', '')
    response = model.generate_content(f"Summarize this in 3 bullet points:\n{text}")
    return jsonify({"summary": response.text})

# Helper functions
def format_questions(text, question_type):
    """Format generated questions consistently"""
    if question_type == "MCQ":
        return re.sub(r'\[CORRECT\]', '(Correct)', text)
    return text

def parse_json_response(text):
    """Extract JSON from Gemini response"""
    start = text.find('{')
    end = text.rfind('}') + 1
    return eval(text[start:end])  # Use ast.literal_eval in production

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)