import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../firebase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  lastLogin?: string;
  preferences?: UserPreferences;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  notificationsEnabled: boolean;
}

interface UserStore {
  user: User | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  checkAuth: () => Promise<User | null>;
  fetchProfile: (user: FirebaseUser) => Promise<User | null>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  error: null,
  initialized: false,

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(firestore, 'users', credentials.user.uid));
      
      let userData: User;
      
      if (userDoc.exists()) {
        userData = userDoc.data() as User;
        // Update lastLogin
        await updateDoc(doc(firestore, 'users', credentials.user.uid), {
          lastLogin: serverTimestamp()
        });
      } else {
        // Create user document if it doesn't exist
        userData = {
          uid: credentials.user.uid,
          email: credentials.user.email || email,
          displayName: credentials.user.displayName,
          photoURL: credentials.user.photoURL,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          preferences: {
            theme: 'system',
            fontSize: 'medium',
            notificationsEnabled: true
          }
        };
        
        await setDoc(doc(firestore, 'users', credentials.user.uid), userData);
      }
      
      // Save to local storage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      set({ user: userData, loading: false, initialized: true });
      return userData;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in';
      console.error('Sign in error:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      
      const userData: User = {
        uid: credentials.user.uid,
        email: credentials.user.email || email,
        displayName,
        photoURL: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        preferences: {
          theme: 'system',
          fontSize: 'medium',
          notificationsEnabled: true
        }
      };
      
      await setDoc(doc(firestore, 'users', credentials.user.uid), userData);
      
      // Save to local storage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      set({ user: userData, loading: false, initialized: true });
      return userData;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign up';
      console.error('Sign up error:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      set({ user: null, loading: false, initialized: true });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to log out';
      console.error('Logout error:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateProfile: async (data) => {
    const { user } = get();
    if (!user) {
      set({ error: 'No user logged in' });
      throw new Error('No user logged in');
    }
    
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      const updatedUser = { ...user, ...data };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      set({ user: updatedUser, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile';
      console.error('Update profile error:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updatePreferences: async (preferences) => {
    const { user } = get();
    if (!user) {
      set({ error: 'No user logged in' });
      throw new Error('No user logged in');
    }
    
    set({ loading: true, error: null });
    try {
      const updatedPreferences: UserPreferences = {
        theme: user.preferences?.theme || 'system',
        fontSize: user.preferences?.fontSize || 'medium',
        notificationsEnabled: user.preferences?.notificationsEnabled ?? true,
        ...preferences
      };
      
      await updateDoc(doc(firestore, 'users', user.uid), {
        preferences: updatedPreferences,
        updatedAt: serverTimestamp()
      });
      
      const updatedUser = {
        ...user,
        preferences: updatedPreferences
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      set({ user: updatedUser, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update preferences';
      console.error('Update preferences error:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    set({ loading: true, error: null });
    try {
      // Check AsyncStorage first for faster loading
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedUser) {
        const userData = JSON.parse(storedUser) as User;
        set({ user: userData, loading: false, initialized: true });
        return userData;
      }
      
      // If no stored user, check Firebase auth state
      return new Promise<User | null>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          unsubscribe();
          
          if (firebaseUser) {
            try {
              const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
              
              if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                set({ user: userData, loading: false, initialized: true });
                resolve(userData);
              } else {
                set({ user: null, loading: false, initialized: true });
                resolve(null);
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
              set({ user: null, error: 'Failed to fetch user data', loading: false, initialized: true });
              resolve(null);
            }
          } else {
            set({ user: null, loading: false, initialized: true });
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Auth check error:', error);
      set({ user: null, error: 'Failed to check authentication', loading: false, initialized: true });
      return null;
    }
  },

  fetchProfile: async (user) => {
    set({ loading: true, error: null });
    try {
      if (!user || !user.uid) {
        set({ error: 'No user provided' });
        return null;
      }

      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        set({ profile: userData, loading: false });
        return userData;
      } else {
        set({ error: 'User profile not found', loading: false });
        return null;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch user profile';
      console.error('Fetch profile error:', errorMessage);
      set({ error: errorMessage, loading: false });
      return null;
    }
  }
})); 