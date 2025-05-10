import { FaUpload, FaSearch, FaChartLine, FaCheckCircle, FaComments } from 'react-icons/fa';

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <nav className="w-64 bg-white shadow-md">
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">AI Learning Assistant</h2>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'upload' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FaUpload className="mr-3" />
              PDF Processor
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('evaluator')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'evaluator' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FaCheckCircle className="mr-3" />
              Answer Evaluator
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'search' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FaSearch className="mr-3" />
              Web Search
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FaChartLine className="mr-3" />
              Analytics
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'chat' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FaComments className="mr-3" />
              Chat/Forum
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}