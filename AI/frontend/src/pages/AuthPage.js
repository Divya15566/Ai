import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import AuthForm from '../components/AuthForm';

import logo from '../assets/logo.png';
import { socialAuth, googleProvider } from '../firebase';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const handleSocialLogin = async (provider) => {
    try {
      await socialAuth(provider);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      
      
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/20">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="AI Learning" className="h-16" />
            </div>
            
            {/* Changed from h2 to h1 and modified text */}
            <h1 className="text-3xl font-bold text-center text-white mb-2">
              Welcome back
            </h1>
            <p className="text-center text-white/80 mb-8">
              Sign in to continue your learning journey
            </p>

            <AuthForm />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/80">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleSocialLogin(googleProvider)}
                className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition"
              >
                <FontAwesomeIcon icon={faGoogle} />
                Google
              </button>
              
            </div>
          </div>
          
          <div className="bg-white/5 px-8 py-4 text-center">
            <p className="text-white/70 text-sm">
              By continuing, you agree to our Terms and Privacy Policy
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}