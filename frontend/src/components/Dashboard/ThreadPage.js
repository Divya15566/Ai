import { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ThreadPage() {
  const { threadId } = useParams();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Teacher', text: 'Welcome to the thread!', pinned: false },
    { id: 2, sender: 'Student', text: 'Can someone explain question 3?', pinned: false },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, sender: 'Student', text: newMessage.trim(), pinned: false },
      ]);
      setNewMessage('');
    }
  };

  const handlePinMessage = (id) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, pinned: !message.pinned } : message
      )
    );
  };

  const handleReportMessage = (id) => {
    alert(`Message ${id} has been reported.`);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages
          .sort((a, b) => b.pinned - a.pinned) // Pinned messages appear first
          .map((message) => (
            <div key={message.id} className="mb-4">
              <p
                className={`inline-block p-2 rounded-lg ${
                  message.sender === 'Student'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {message.text}
              </p>
              <div className="mt-2 text-sm text-gray-600 flex space-x-4">
                <button
                  onClick={() => handlePinMessage(message.id)}
                  className="text-blue-500 hover:underline"
                >
                  {message.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => handleReportMessage(message.id)}
                  className="text-red-500 hover:underline"
                >
                  Report
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
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}