import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaSpinner, FaVolumeUp, FaStop } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function WebSearch() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReading, setIsReading] = useState(false);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Clean answer text by removing special formatting
  const cleanAnswerText = (text) => {
    if (!text) return '';
    
    // Remove markdown headers (##, ### etc.)
    let cleaned = text.replace(/^#+\s*/gm, '');
    // Remove code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    // Remove inline code markers
    cleaned = cleaned.replace(/`[^`]*`/g, '');
    // Remove excessive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    // Remove asterisks used for bold/italic
    cleaned = cleaned.replace(/\*\*/g, '').replace(/\*/g, '');
    
    return cleaned.trim();
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await axios.post('http://localhost:5002/web-search', { 
        query,
        instructions: "Provide a concise, easy-to-understand answer in simple paragraphs. Avoid markdown formatting, code blocks, or special characters. Use plain text only."
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setAnswer(cleanAnswerText(data.answer));
      toast.success('Answer generated!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Search failed';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const readAloud = () => {
    if (!answer) return;
    
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    const cleanText = cleanAnswerText(answer);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setIsReading(false);

    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask any academic question..."
          className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 rounded-r-lg hover:bg-blue-700 flex items-center disabled:bg-blue-400"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Searching...
            </>
          ) : (
            <>
              <FaSearch className="mr-2" />
              Search
            </>
          )}
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}

      {/* Answer Display */}
      {answer && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">AI Answer:</h3>
            <div className="flex space-x-2">
              <button
                onClick={readAloud}
                className={`p-2 rounded-full ${
                  isReading ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
                aria-label="Read answer aloud"
              >
                {isReading ? <FaStop /> : <FaVolumeUp />}
              </button>
            </div>
          </div>
          <div className="whitespace-pre-wrap bg-white p-4 rounded">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}