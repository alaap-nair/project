// DEPRECATED: This file is being phased out. Please use config/firebase.ts instead.
// The Firebase app should only be initialized once across the entire application.
// This file will be removed in a future update.

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import Constants from 'expo-constants';

// Your Firebase configuration for React Native
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCo3lUo8FNlQlI95l52rtlzcWezd1Le0jk",
  authDomain: "lenovo-ai-team-app.firebaseapp.com",
  projectId: "lenovo-ai-team-app",
  storageBucket: "lenovo-ai-team-app.appspot.com",
  messagingSenderId: "70256622721",
  appId: "1:70256622721:web:e08844cc4cc1f78cfc2180",
};

// Re-use existing Firebase app if available instead of initializing a new one
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // Firebase app already exists, retrieve the existing instance
  console.log('Firebase app already exists, re-using existing instance');
  app = initializeApp();
}

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage }; 