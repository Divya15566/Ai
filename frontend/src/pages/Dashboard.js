import { useState, useEffect } from 'react';
import { FaFilePdf, FaPlay, FaDownload, FaSearch, FaChartBar } from 'react-icons/fa';
import PDFUploader from '../components/Dashboard/PDFUploader';
import WebSearch from '../components/Dashboard/WebSearch';
import Analytics from '../components/Dashboard/Analytics';
import Sidebar from '../components/Dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('upload');
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const navigate = useNavigate();

  // Mock authentication check
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const handlePdfAdded = (newPdf) => {
    setPdfs([...pdfs, newPdf]);
    toast.success('PDF processed successfully!');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {activeTab === 'upload' && 'PDF Processor'}
              {activeTab === 'search' && 'Web Search'}
              {activeTab === 'analytics' && 'Learning Analytics'}
            </h1>
            <p className="text-gray-600 mt-2">
              {activeTab === 'upload' && 'Upload textbooks to generate practice questions'}
              {activeTab === 'search' && 'Get answers from across the web'}
              {activeTab === 'analytics' && 'Track your learning progress'}
            </p>
          </header>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-md p-6">
            {activeTab === 'upload' && (
              <PDFUploader 
                onPdfProcessed={handlePdfAdded} 
                pdfs={pdfs}
                selectedPdf={selectedPdf}
                onSelectPdf={setSelectedPdf}
              />
            )}

            {activeTab === 'search' && <WebSearch />}

            {activeTab === 'analytics' && <Analytics pdfs={pdfs} />}
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-6 flex justify-end space-x-4">
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