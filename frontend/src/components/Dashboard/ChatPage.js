import { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Teacher', text: 'Hello, how can I help you?' },
    { id: 2, sender: 'Student', text: 'I have a question about the assignment.' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, sender: 'Student', text: newMessage.trim() },
      ]);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${message.sender === 'Student' ? 'text-right' : 'text-left'}`}
          >
            <p
              className={`inline-block p-2 rounded-lg ${
                message.sender === 'Student'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.text}
            </p>
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