import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaFlag } from 'react-icons/fa';
import axios from 'axios';

// Use the same axios instance
const api = axios.create({
  baseURL: 'http://localhost:5002',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default function ThreadPage() {
  const { threadId } = useParams();
  const [thread, setThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchThread = async () => {
      try {
        const response = await api.get(`/threads/${threadId}`);
        if (isMounted) {
          if (response.data) {
            setThread(response.data);
          } else {
            console.error('Thread not found');
          }
        }
      } catch (error) {
        console.error('Failed to fetch thread:', error);
      }
    };

    fetchThread();

    return () => {
      isMounted = false;
    };
  }, [threadId]);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        const response = await api.post(
          `/threads/${threadId}/messages`,
          { text: newMessage, sender: 'User' }
        );
        setThread((prev) => ({
          ...prev,
          messages: [...prev.messages, response.data],
        }));
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const handleReportMessage = async (messageId) => {
    try {
      await api.post(
        `/threads/${threadId}/messages/${messageId}/report`
      );
      alert('Message has been reported.');
    } catch (error) {
      console.error('Failed to report message:', error);
    }
  };

  if (!thread) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow p-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{thread.title}</h1>
        <p className="text-gray-600 mt-2">{thread.description}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {thread.messages.map((message) => (
          <div key={message.id} className="bg-white p-4 rounded-lg shadow mb-4">
            <p className="font-medium text-gray-800">{message.sender}</p>
            <p className="text-gray-600 mt-2">{message.text}</p>
            <div className="mt-2 text-sm text-gray-500 flex space-x-4">
              <button
                onClick={() => handleReportMessage(message.id)}
                className="text-red-500 hover:underline flex items-center"
              >
                <FaFlag className="mr-1" /> Report
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}