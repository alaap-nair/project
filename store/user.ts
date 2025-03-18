import { create } from 'zustand';
import { doc, getDoc, updateDoc, DocumentData, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from 'firebase/auth';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  bio?: string;
  subjects?: string[];
  privacy?: {
    showProfile: boolean;
    showNotes: boolean;
    showProgress: boolean;
    showFriends: boolean;
  };
  preferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    darkMode: boolean;
    language: string;
  };
  stats?: {
    totalNotes: number;
    totalTasks: number;
    completedTasks: number;
    studyStreak: number;
    lastStudyDate?: Date;
  };
  createdAt?: any;
  updatedAt?: any;
}

interface UserStore {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: (user: User) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  resetStore: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async (user: User) => {
    set({ isLoading: true, error: null });
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data() as DocumentData;
        set({ profile: data as UserProfile });
        console.log("Fetched user profile:", data);
      } else {
        // If the profile doesn't exist yet (rare case), create a new profile
        console.log("User profile not found, creating a new one");
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL,
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
        };
        await setDoc(doc(db, 'users', user.uid), newProfile as DocumentData);
        set({ profile: newProfile });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      set({ error: 'Failed to fetch user profile' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const { profile } = get();
    if (!profile) return;

    set({ isLoading: true, error: null });
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };
      
      await updateDoc(doc(db, 'users', profile.uid), updateData as DocumentData);
      
      set({ 
        profile: {
          ...profile,
          ...data,
          updatedAt: new Date(),
        } 
      });
      
      console.log("Profile updated successfully");
    } catch (error) {
      console.error('Error updating user profile:', error);
      set({ error: 'Failed to update user profile' });
    } finally {
      set({ isLoading: false });
    }
  },

  resetStore: () => {
    set({ profile: null, isLoading: false, error: null });
  },
})); 