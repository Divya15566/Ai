import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash } from 'react-icons/fa';
import axios from 'axios';

// Create an axios instance with base URL and headers
const api = axios.create({
  baseURL: 'http://localhost:5002',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default function ChatList() {
  const [threads, setThreads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await api.get('/threads');
        setThreads(response.data);
      } catch (error) {
        console.error('Failed to fetch threads:', error);
      }
    };

    fetchThreads();
  }, []);

  const handleThreadClick = (threadId) => {
    navigate(`/thread/${threadId}`);
  };

  const handleCreateThread = async () => {
    if (newThread.title.trim() && newThread.description.trim()) {
      const tempThread = {
        id: Date.now().toString(),
        title: newThread.title,
        description: newThread.description,
      };
      setThreads((prev) => [tempThread, ...prev]);
      setNewThread({ title: '', description: '' });
      setIsCreatingThread(false);

      try {
        const response = await api.post('/threads', {
          title: tempThread.title,
          description: tempThread.description
        });
        setThreads((prev) => [response.data, ...prev.filter((t) => t.id !== tempThread.id)]);
      } catch (error) {
        console.error('Failed to create thread:', error);
        alert('Failed to create thread. Please try again.');
        setThreads((prev) => prev.filter((t) => t.id !== tempThread.id));
      }
    }
  };

  const handleDeleteThread = async (threadId) => {
    try {
      const response = await api.delete(`/threads/${threadId}`);
      if (response.status === 200) {
        setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
        alert('Thread deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
      alert('Failed to delete thread');
    }
  };

  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-white shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Threads</h2>
        <button
          onClick={() => setIsCreatingThread(true)}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
        >
          <FaPlus />
        </button>
      </div>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search threads..."
        className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <ul className="space-y-2">
        {filteredThreads.map((thread) => (
          <li
            key={thread.id}
            className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-100"
          >
            <div onClick={() => handleThreadClick(thread.id)} className="cursor-pointer">
              <h3 className="font-medium text-gray-800">{thread.title}</h3>
              <p className="text-sm text-gray-600 truncate">{thread.description}</p>
            </div>
            <button
              onClick={() => handleDeleteThread(thread.id)}
              className="text-red-500 hover:underline flex items-center"
            >
              <FaTrash className="ml-2" />
            </button>
          </li>
        ))}
      </ul>

      {isCreatingThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Create New Thread</h3>
            <input
              type="text"
              placeholder="Thread Title"
              value={newThread.title}
              onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
              className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Thread Description"
              value={newThread.description}
              onChange={(e) => setNewThread({ ...newThread, description: e.target.value })}
              className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCreatingThread(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateThread}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}