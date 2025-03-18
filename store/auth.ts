import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetStore: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log(`Attempting to sign in with email: ${email}`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful');
      // No need to set user here, onAuthStateChanged will handle it
    } catch (error) {
      console.error('Error signing in:', error);
      
      // Extract error message for better user feedback
      let errorMessage = 'Failed to sign in';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Make Firebase error messages more user-friendly
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
      
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User account created');
      
      // Update the user profile with display name
      await updateProfile(userCredential.user, { displayName });
      console.log('User profile updated with display name');
      
      // Create initial user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
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
      console.log('User document created in Firestore');
      
    } catch (error) {
      console.error('Error signing up:', error);
      
      // Extract error message for better user feedback
      let errorMessage = 'Failed to sign up';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Make Firebase error messages more user-friendly
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
      await firebaseSignOut(auth);
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      set({ error: 'Failed to sign out' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetStore: () => {
    set({ user: null, isLoading: false, error: null });
  },
}));

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  console.log('Auth state changed:', user ? `User ${user.uid} signed in` : 'User signed out');
  useAuthStore.setState({ user });
}); 