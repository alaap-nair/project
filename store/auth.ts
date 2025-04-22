import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
  setPersistence,
  Auth,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define interfaces for the Firebase module
interface FirebaseModule {
  auth: Auth;
  firestore: Firestore;
}

// Import auth and firestore from firebase config with type assertion
import * as firebase from '../config/firebase';
const { auth, firestore } = firebase as unknown as FirebaseModule;

// Key for storing auth token
const AUTH_TOKEN_KEY = 'bolt_notes_auth_token';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetStore: () => void;
  cleanup: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthReady: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log(`Attempting to sign in with email: ${email}`);
      
      // For React Native, we don't need to set persistence manually
      // It's already handled by AsyncStorage in the firebase config
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful, user:', userCredential.user.uid);
      
      // Store a token in AsyncStorage as a secondary persistence mechanism
      if (userCredential.user) {
        try {
          const token = await userCredential.user.getIdToken();
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
          console.log('Auth token stored in AsyncStorage');
        } catch (tokenError) {
          console.error('Failed to store auth token:', tokenError);
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
      let errorMessage = 'Failed to sign in';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('auth/invalid-email')) {
          errorMessage = 'The email address is invalid.';
        } else if (errorMessage.includes('auth/user-disabled')) {
          errorMessage = 'This account has been disabled.';
        } else if (errorMessage.includes('auth/user-not-found') || errorMessage.includes('auth/wrong-password')) {
          errorMessage = 'Invalid email or password.';
        }
      }
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log(`Attempting to create account with email: ${email}`);
      
      // For React Native, we don't need to set persistence manually
      // It's already handled by AsyncStorage in the firebase config
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      // Create the user document in Firestore
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName,
        email,
        photoURL: null,
        privacy: {
          showProfile: true,
          showNotes: false,
          showProgress: true,
          showFriends: true,
        },
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          darkMode: false,
          language: 'English',
        },
        stats: {
          totalNotes: 0,
          totalTasks: 0,
          completedTasks: 0,
          studyStreak: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Store a token in AsyncStorage as a secondary persistence mechanism
      if (userCredential.user) {
        try {
          const token = await userCredential.user.getIdToken();
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
          console.log('Auth token stored in AsyncStorage');
        } catch (tokenError) {
          console.error('Failed to store auth token:', tokenError);
        }
      }
      
      console.log('Sign up successful, user:', userCredential.user.uid);
    } catch (error) {
      console.error('Error signing up:', error);
      let errorMessage = 'Failed to sign up';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('auth/email-already-in-use')) {
          errorMessage = 'This email is already in use. Please sign in or reset your password.';
        } else if (errorMessage.includes('auth/invalid-email')) {
          errorMessage = 'The email address is invalid.';
        } else if (errorMessage.includes('auth/weak-password')) {
          errorMessage = 'The password is too weak. Please use a stronger password.';
        }
      }
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      // Clear the auth token from AsyncStorage
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      
      await firebaseSignOut(auth);
      set({ user: null, isAuthReady: true }); // Explicitly set user to null
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      set({ error: 'Failed to sign out' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetStore: () => {
    set({ user: null, isLoading: false, error: null, isAuthReady: true });
  },

  cleanup: () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  },
}));

// Set up auth state listener only once
let unsubscribe: (() => void) | null = null;

if (!unsubscribe) {
  unsubscribe = onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed:', user ? `User ${user.uid} signed in` : 'User signed out');
    
    if (user) {
      // If we have a user, store the token
      try {
        const token = await user.getIdToken(true);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        console.log('Updated auth token in AsyncStorage');
      } catch (tokenError) {
        console.error('Failed to store auth token:', tokenError);
      }
    } else {
      // If no user, remove the token
      try {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        console.log('Removed auth token from AsyncStorage');
      } catch (removeError) {
        console.error('Failed to remove auth token:', removeError);
      }
    }
    
    useAuthStore.setState({ user, isAuthReady: true });
  });
}

// Function to check if a user is authenticated via token when Firebase auth fails
export const checkAuthToken = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token; // Return true if we have a token
  } catch (error) {
    console.error('Error checking auth token:', error);
    return false;
  }
}; 