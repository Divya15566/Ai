import { useState } from 'react';
import axios from 'axios';
import { FaFilePdf, FaPlay, FaDownload } from 'react-icons/fa';

export default function PDFUploader() {
  const [pdfText, setPdfText] = useState('');
  const [questions, setQuestions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    num_questions: 5,
    question_type: "MCQ",
    page_range: "1-5"
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const file = e.target.files[0];
      if (!file) return;

      const form = new FormData();
      form.append('pdf', file);  // Make sure this matches your Flask endpoint ('pdf')
      
      // Append other form data
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });

      const { data } = await axios.post('http://localhost:5002/process-pdf', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setQuestions(data.questions);
      if (data.text) setPdfText(data.text);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process PDF');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of your component remains the same ...
  const readAloud = () => {
    const speech = new SpeechSynthesisUtterance(questions);
    window.speechSynthesis.speak(speech);
  };

  return (
    <div className="space-y-6">
      {/* PDF Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleUpload}
          className="hidden" 
          id="pdf-upload"
        />
        <label 
          htmlFor="pdf-upload"
          className="cursor-pointer flex flex-col items-center space-y-4"
        >
          <FaFilePdf className="text-4xl text-red-500" />
          <span className="text-lg font-medium">Upload PDF Textbook</span>
          <button className="btn-primary">Select File</button>
        </label>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Question Type</label>
          <select 
            value={formData.question_type}
            onChange={(e) => setFormData({...formData, question_type: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="MCQ">Multiple Choice</option>
            <option value="Subjective">Subjective</option>
          </select>
        </div>
        <div>
          <label>Number of Questions</label>
          <input 
            type="number" 
            value={formData.num_questions}
            onChange={(e) => setFormData({...formData, num_questions: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Pages (e.g., 1-5)</label>
          <input 
            type="text" 
            value={formData.page_range}
            onChange={(e) => setFormData({...formData, page_range: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {/* Results */}
      {questions && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-end space-x-4 mb-4">
            <button onClick={readAloud} className="btn-secondary">
              <FaPlay /> Read Aloud
            </button>
            <button 
              onClick={() => alert("Implement PDF download")}
              className="btn-primary"
            >
              <FaDownload /> Download PDF
            </button>
          </div>
          <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
            {questions}
          </pre>
        </div>
      )}
    </div>
  );
}