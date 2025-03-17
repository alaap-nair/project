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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage }; 