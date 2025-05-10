import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Toaster } from 'react-hot-toast';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/navbar';
import HomePage from './pages/HomePage';
import ChatList from './components/Dashboard/ChatList';
import ChatPage from './components/Dashboard/ChatPage';
import ThreadPage from './components/Dashboard/ThreadPage';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      {/* Navbar should be OUTSIDE Routes but INSIDE BrowserRouter */}
      <Navbar user={user} />
      
      {/* Single Routes container */}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<div>Profile Page</div>} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/thread/:threadId" element={<ThreadPage />} />
        </Route>

        {/* 404 page */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
      
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          },
          success: {
            iconTheme: {
              primary: '#4ADE80',
              secondary: '#1E293B'
            }
          },
          error: {
            iconTheme: {
              primary: '#F87171',
              secondary: '#1E293B'
            }
          }
        }}
      />
    </BrowserRouter>
  );
}

export default App;