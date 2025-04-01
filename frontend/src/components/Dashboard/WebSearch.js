import { useState } from 'react';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';

export default function WebSearch() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/web-search', { query });
      setAnswer(data.answer);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask any academic question..."
          className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 rounded-r-lg hover:bg-blue-700 flex items-center"
        >
          <FaSearch className="mr-2" />
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {answer && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold mb-2">AI Answer:</h3>
          <p className="whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
}