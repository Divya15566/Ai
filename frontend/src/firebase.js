import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDOq3cF2JypA8LybTlwDBzvHekUz_mZDqY",
    authDomain: "ailearning-ea7ee.firebaseapp.com",
    projectId: "ailearning-ea7ee",
    storageBucket: "ailearning-ea7ee.firebasestorage.app",
    messagingSenderId: "922092082296",
    appId: "1:922092082296:web:4c1e733eee55dbf655498d",
    measurementId: "G-JQ166ZZHTQ"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Social Auth Providers
export const googleProvider = new GoogleAuthProvider();

export const socialAuth = async (provider) => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    throw error;
  }
};