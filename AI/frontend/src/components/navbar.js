import { Link } from 'react-router-dom';
import { faRobot, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'react-hot-toast';

export default function Navbar({ user }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FontAwesomeIcon 
                icon={faRobot} 
                className="h-6 w-6 text-purple-600 mr-2" 
              />
              <span className="text-xl font-bold text-gray-800">AI Learning</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-sm text-gray-700 hover:text-purple-600"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}