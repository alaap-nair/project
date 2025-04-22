import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCo3lUo8FNlQlI95l52rtlzcWezd1Le0jk",
  authDomain: "lenovo-ai-team-app.firebaseapp.com",
  projectId: "lenovo-ai-team-app",
  storageBucket: "lenovo-ai-team-app.appspot.com",
  messagingSenderId: "70256622721",
  appId: "1:70256622721:web:e08844cc4cc1f78cfc2180",
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

// Mark when initialization is complete to avoid re-initialization
let isInitialized = false;

if (!isInitialized) {
  try {
    if (!getApps().length) {
      console.log("Initializing Firebase app...");
      app = initializeApp(firebaseConfig);
      
      // Use AsyncStorage for auth persistence
      console.log("Setting up Firebase auth with AsyncStorage persistence...");
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      
      db = getFirestore(app);
      storage = getStorage(app);
    } else {
      console.log("Getting existing Firebase app...");
      app = getApp();
      try {
        auth = getAuth(app);
      } catch (e) {
        console.log("Re-initializing Firebase auth with AsyncStorage persistence...");
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      }
      db = getFirestore(app);
      storage = getStorage(app);
    }
    
    console.log("Firebase initialization complete.");
    isInitialized = true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

// Remove web-specific persistence code since we're using React Native persistence
// We've already set up persistence with getReactNativePersistence above

export { app, auth, db as firestore, storage }; 