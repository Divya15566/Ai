import { useState } from 'react';
import axios from 'axios';
import { FaFilePdf, FaPlay, FaDownload, FaSpinner, FaMagic, FaRedo } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';

export default function PDFUploader({ 
  onQuestionsGenerated, 
  initialQuestions, 
  initialPdfFile,
  regenerationCount
}) {
  const [questions, setQuestions] = useState(initialQuestions || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [pdfFile, setPdfFile] = useState(initialPdfFile || null);
  const [formData, setFormData] = useState({
    num_questions: 5,
    question_type: "MCQ",
    page_range: "all"
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setPdfFile(file);
    toast.success('PDF uploaded successfully! Click "Generate Questions" to proceed.');
  };

  const generateQuestions = async () => {
    if (!pdfFile) {
      toast.error('Please upload a PDF first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const form = new FormData();
      form.append('pdf', pdfFile);
      
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
      if (onQuestionsGenerated) {
        onQuestionsGenerated(data.questions, pdfFile);
      }
      toast.success('Questions generated successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to generate questions';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateQuestions = async () => {
    if (!pdfFile) return;
    await generateQuestions();
  };

  const readAloud = () => {
    if (!questions) {
      toast.error('No questions to read');
      return;
    }
    const speech = new SpeechSynthesisUtterance(questions);
    window.speechSynthesis.speak(speech);
  };

  const downloadQuestions = () => {
    if (!questions) {
      toast.error('No questions to download');
      return;
    }
  
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
      title: 'Generated Questions',
      subject: 'Practice Questions',
      author: 'AI Learning Assistant'
    });
  
    // Add title
    doc.setFontSize(18);
    doc.text('Generated Questions with Answers', 105, 15, { align: 'center' });
  
    // Add metadata
    doc.setFontSize(12);
    doc.text(`Generated from: ${pdfFile.name}`, 14, 25);
    doc.text(`Type: ${formData.question_type}`, 14, 32);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 39);
    doc.text(`Total Questions: ${questions.split('\n\n').filter(q => q.startsWith('Q')).length}`, 14, 46);
  
    // Process questions for PDF
    doc.setFontSize(14);
    let yPosition = 60;
    const pageHeight = doc.internal.pageSize.height - 20;
    const splitQuestions = questions.split('\n\n');
  
    splitQuestions.forEach((questionBlock, index) => {
      if (!questionBlock.trim()) return;
  
      // Check if we need a new page
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }
  
      // Split question into lines and process each line
      const questionLines = questionBlock.split('\n');
      questionLines.forEach(line => {
        if (line.trim()) {
          // Handle correct answers formatting
          if (line.includes('(Correct)')) {
            doc.setTextColor(0, 128, 0); // Green for correct answers
          } else {
            doc.setTextColor(0, 0, 0); // Black for regular text
          }
  
          const textLines = doc.splitTextToSize(line, 180);
          textLines.forEach(textLine => {
            if (yPosition > pageHeight) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(textLine, 14, yPosition);
            yPosition += 7;
          });
        }
      });
  
      // Add space between questions
      yPosition += 10;
    });
  
    // Save the PDF
    doc.save(`questions-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="space-y-6" key={regenerationCount}>
      {/* PDF Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange}
          className="hidden" 
          id="pdf-upload"
          disabled={isLoading}
        />
        <label 
          htmlFor="pdf-upload"
          className={`cursor-pointer flex flex-col items-center space-y-4 ${isLoading ? 'opacity-50' : ''}`}
        >
          <FaFilePdf className="text-4xl text-red-500" />
          <span className="text-lg font-medium">Upload PDF Textbook</span>
          {pdfFile ? (
            <div className="text-blue-600 font-medium">
              {pdfFile.name}
            </div>
          ) : (
            <button 
              className={`btn-primary ${isLoading ? 'bg-gray-400' : ''}`}
              disabled={isLoading}
            >
              Select File
            </button>
          )}
        </label>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 font-medium">Question Type</label>
          <select 
            value={formData.question_type}
            onChange={(e) => setFormData({...formData, question_type: e.target.value})}
            className="w-full p-2 border rounded"
            disabled={isGenerating}
          >
            <option value="MCQ">Multiple Choice</option>
            <option value="Subjective">Subjective</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Number of Questions</label>
          <input 
            type="number" 
            min="1"
            max="20"
            value={formData.num_questions}
            onChange={(e) => setFormData({...formData, num_questions: e.target.value})}
            className="w-full p-2 border rounded"
            disabled={isGenerating}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Pages (e.g., 1-5)</label>
          <input 
            type="text" 
            value={formData.page_range}
            onChange={(e) => setFormData({...formData, page_range: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="1-5 or 'all'"
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {/* Generate Button - Only shown after PDF upload */}
        {pdfFile && !questions && (
          <button
            onClick={generateQuestions}
            className="btn-primary flex items-center px-6 py-3"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FaMagic className="mr-2" />
                Generate Questions
              </>
            )}
          </button>
        )}

        {/* Regenerate Button - Only shown when questions exist */}
        {questions && (
          <button
            onClick={regenerateQuestions}
            className="btn-secondary flex items-center px-6 py-3"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Regenerating...
              </>
            ) : (
              <>
                <FaRedo className="mr-2" />
                Regenerate Questions
              </>
            )}
          </button>
        )}
      </div>

      {/* Loading State */}
      {(isLoading || isGenerating) && (
        <div className="flex justify-center items-center p-4">
          <FaSpinner className="animate-spin text-blue-500 text-2xl mr-2" />
          <span>{isLoading ? 'Uploading PDF...' : 'Generating questions...'}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {questions && !isGenerating && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-end space-x-4 mb-4">
            <button 
              onClick={readAloud}
              className="btn-secondary flex items-center"
            >
              <FaPlay className="mr-2" /> Read Aloud
            </button>
            <button 
              onClick={downloadQuestions}
              className="btn-primary flex items-center"
            >
              <FaDownload className="mr-2" /> Download as PDF
            </button>
          </div>
          <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            {questions}
          </pre>
        </div>
      )}
    </div>
  );
}