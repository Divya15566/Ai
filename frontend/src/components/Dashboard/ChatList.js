import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChatList() {
  const [threads, setThreads] = useState([
    { id: 1, title: 'Assignment Help', lastMessage: 'Can someone explain question 3?' },
    { id: 2, title: 'Exam Preparation', lastMessage: 'Tips for the upcoming exam?' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleThreadClick = (threadId) => {
    navigate(`/thread/${threadId}`);
  };

  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-white shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Threads</h2>
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
            className="p-3 border rounded-lg hover:bg-gray-100 cursor-pointer"
            onClick={() => handleThreadClick(thread.id)}
          >
            <h3 className="font-medium text-gray-800">{thread.title}</h3>
            <p className="text-sm text-gray-600 truncate">{thread.lastMessage}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}