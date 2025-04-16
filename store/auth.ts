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
  isAuthReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetStore: () => void;
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
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful');
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
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
      await firebaseSignOut(auth);
      set({ user: null, isAuthReady: true }); // Explicitly set user to null
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
}));

// Set up auth state listener only once
let unsubscribe: (() => void) | null = null;

if (!unsubscribe) {
  unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? `User ${user.uid} signed in` : 'User signed out');
    useAuthStore.setState({ user, isAuthReady: true });
  });
}

// Clean up listener when the app is unmounted
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    unsubscribe?.();
  });
} 