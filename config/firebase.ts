import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  app = getApp();
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage }; 