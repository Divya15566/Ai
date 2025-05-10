import { FaSpinner } from 'react-icons/fa';
import { useEffect, useState } from 'react';

export default function LoadingOverlay() {
  const [show, setShow] = useState(false);

  // Delay showing spinner to prevent flash on fast loads
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <FaSpinner className="animate-spin text-blue-500 text-4xl mb-3 mx-auto" />
        <p className="text-gray-600 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );
}