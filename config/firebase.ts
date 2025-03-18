import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCo3lUo8FNlQlI95l52rtlzcWezd1Le0jk",
  authDomain: "lenovo-ai-team-app.firebaseapp.com",
  projectId: "lenovo-ai-team-app",
  storageBucket: "lenovo-ai-team-app.appspot.com",
  messagingSenderId: "70256622721",
  appId: "1:70256622721:web:e08844cc4cc1f78cfc2180",
};

// Check if Firebase app is already initialized
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // Firebase app already exists, retrieve the existing instance
  console.log('Firebase app already exists');
  app = initializeApp();
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const firestore = getFirestore(app); // Alias for backward compatibility
export const storage = getStorage(app);

export default app; 