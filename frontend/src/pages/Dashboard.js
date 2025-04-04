import { useState, useEffect, useCallback } from 'react';
import { FaFilePdf, FaSearch, FaChartBar, FaCheckCircle } from 'react-icons/fa';
import LoadingOverlay from '../components/Common/LoadingOverlay';
import useDashboardLoader from '../hooks/useDashboardLoader';
import PDFUploader from '../components/Dashboard/PDFUploader';
import WebSearch from '../components/Dashboard/WebSearch';
import Analytics from '../components/Dashboard/Analytics';
import Evaluator from '../components/Dashboard/Evaluator';
import Sidebar from '../components/Dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const isLoading = useDashboardLoader();
  const [activeTab, setActiveTab] = useState('upload');
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Load data from localStorage
  useEffect(() => {
    if (isLoading) return;

    const savedEvals = localStorage.getItem('evaluations');
    const savedQuestions = localStorage.getItem('generatedQuestions');
    const savedPdfFile = localStorage.getItem('pdfFile');

    if (savedEvals) {
      try {
        const parsed = JSON.parse(savedEvals).map(evaluation => ({
          ...evaluation,
          timestamp: evaluation.timestamp || new Date().toISOString(),
          score: Number(evaluation.score),
        }));
        setEvaluations(parsed);
      } catch (e) {
        console.error("Failed to parse evaluations", e);
      }
    }
    if (savedQuestions) setGeneratedQuestions(savedQuestions);
    if (savedPdfFile) setPdfFile(JSON.parse(savedPdfFile));
  }, [isLoading]);

  // Save data to localStorage
  useEffect(() => {
    if (isLoading) return;

    if (evaluations.length > 0) {
      localStorage.setItem('evaluations', JSON.stringify(evaluations));
    }
    if (generatedQuestions) {
      localStorage.setItem('generatedQuestions', generatedQuestions);
    }
    if (pdfFile) {
      localStorage.setItem('pdfFile', JSON.stringify(pdfFile));
    }
  }, [evaluations, generatedQuestions, pdfFile, isLoading]);

  const handlePdfAdded = useCallback((newPdf) => {
    setPdfs(prev => [...prev, newPdf]);
    toast.success('PDF processed successfully!');
  }, []);

  const handleQuestionsGenerated = useCallback((questions, file) => {
    setGeneratedQuestions(questions);
    setPdfFile(file);
    setRegenerationCount(prev => prev + 1);
  }, []);

  const handleEvaluationAdded = useCallback((newEvaluations) => {
    setEvaluations(prev => {
      const formatted = newEvaluations.map(evaluation => ({
        ...evaluation,
        timestamp: evaluation.timestamp || new Date().toISOString(),
        score: Math.max(0, Math.min(100, Number(evaluation.score))),
        isMCQ: evaluation.isMCQ || false
      }));
      return [...formatted, ...prev];
    });
  }, []);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {activeTab === 'upload' && 'PDF Processor'}
              {activeTab === 'search' && 'Web Search'}
              {activeTab === 'analytics' && 'Learning Analytics'}
              {activeTab === 'evaluator' && 'Answer Evaluator'}
            </h1>
            <p className="text-gray-600 mt-2">
              {activeTab === 'upload' && 'Upload textbooks to generate practice questions'}
              {activeTab === 'search' && 'Get answers from across the web'}
              {activeTab === 'analytics' && 'Track your learning progress'}
              {activeTab === 'evaluator' && 'Evaluate your answers against model answers'}
            </p>
          </header>

          <div className="bg-white rounded-xl shadow-md p-6">
            {activeTab === 'upload' && (
              <PDFUploader 
                onPdfProcessed={handlePdfAdded}
                onQuestionsGenerated={handleQuestionsGenerated}
                pdfs={pdfs}
                selectedPdf={selectedPdf}
                onSelectPdf={setSelectedPdf}
                initialQuestions={generatedQuestions}
                initialPdfFile={pdfFile}
                regenerationCount={regenerationCount}
              />
            )}

            {activeTab === 'search' && <WebSearch />}

            {activeTab === 'analytics' && (
              <Analytics 
                evaluations={evaluations}
                key={evaluations.length}
              />
            )}

            {activeTab === 'evaluator' && (
              <Evaluator 
                generatedQuestions={generatedQuestions}
                onEvaluationAdded={handleEvaluationAdded}
                pdfFile={pdfFile}
              />
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            {activeTab === 'upload' && generatedQuestions && (
              <button 
                onClick={() => setActiveTab('evaluator')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FaCheckCircle className="mr-2" />
                Evaluate Answers
              </button>
            )}
            <button 
              onClick={() => window.speechSynthesis.cancel()}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg"
            >
              Stop Speech
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}