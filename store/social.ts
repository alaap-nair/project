import { create } from 'zustand';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase.config';
import { useAuthStore } from './auth';

export interface FriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ClassEnrollment {
  _id: string;
  classId: string;
  userId: string;
  role: 'student' | 'creator';
  joinedAt: string;
}

export interface Class {
  _id: string;
  name: string;
  description: string;
  creatorId: string;
  enrollmentCode: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocialStore {
  friends: string[];
  friendRequests: FriendRequest[];
  enrolledClasses: Class[];
  loading: boolean;
  error: string | null;
  
  // Friend management
  sendFriendRequest: (receiverId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  getFriendRequests: () => Promise<void>;
  getFriends: () => Promise<void>;
  
  // Class management
  createClass: (name: string, description: string, isPublic: boolean) => Promise<Class>;
  joinClass: (enrollmentCode: string) => Promise<void>;
  leaveClass: (classId: string) => Promise<void>;
  getEnrolledClasses: () => Promise<void>;
}

const useSocialStore = create<SocialStore>((set, get) => ({
  friends: [],
  friendRequests: [],
  enrolledClasses: [],
  loading: false,
  error: null,

  sendFriendRequest: async (receiverId: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Must be logged in to send friend requests');

      const requestData = {
        senderId: currentUser.uid,
        receiverId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'friendRequests'), requestData);
      await get().getFriendRequests();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send friend request' });
    } finally {
      set({ loading: false });
    }
  },

  acceptFriendRequest: async (requestId: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Must be logged in to accept friend requests');

      const requestRef = doc(firestore, 'friendRequests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });

      await get().getFriendRequests();
      await get().getFriends();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to accept friend request' });
    } finally {
      set({ loading: false });
    }
  },

  rejectFriendRequest: async (requestId: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Must be logged in to reject friend requests');

      const requestRef = doc(firestore, 'friendRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });

      await get().getFriendRequests();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reject friend request' });
    } finally {
      set({ loading: false });
    }
  },

  removeFriend: async (friendId: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Must be logged in to remove friends');

      // Find and delete all friend request documents between these users
      const q = query(
        collection(firestore, 'friendRequests'),
        where('status', '==', 'accepted'),
        where('senderId', 'in', [currentUser.uid, friendId]),
        where('receiverId', 'in', [currentUser.uid, friendId])
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      await get().getFriends();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove friend' });
    } finally {
      set({ loading: false });
    }
  },

  getFriendRequests: async () => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Must be logged in to view friend requests');

      const q = query(
        collection(firestore, 'friendRequests'),
        where('receiverId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as FriendRequest[];

      set({ friendRequests: requests });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch friend requests' });
    } finally {
      set({ loading: false });
    }
  },

  getFriends: async () => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Must be logged in to view friends');

      const q = query(
        collection(firestore, 'friendRequests'),
        where('status', '==', 'accepted'),
        where('senderId', 'in', [currentUser.uid])
      );

      const querySnapshot = await getDocs(q);
      const friends = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return data.receiverId;
      });

      set({ friends });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch friends' });
    } finally {
      set({ loading: false });
    }
  },

  createClass: async (name: string, description: string, isPublic: boolean) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Must be logged in to create a class');

      const enrollmentCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const classData = {
        name,
        description,
        creatorId: currentUser.uid,
        enrollmentCode,
        isPublic,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(firestore, 'classes'), classData);
      
      // Create enrollment for creator
      await addDoc(collection(firestore, 'enrollments'), {
        classId: docRef.id,
        userId: currentUser.uid,
        role: 'creator',
        joinedAt: serverTimestamp(),
      });

      await get().getEnrolledClasses();
      
      return {
        _id: docRef.id,
        ...classData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Class;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create class' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  joinClass: async (enrollmentCode: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Must be logged in to join a class');

      // Find class by enrollment code
      const q = query(
        collection(firestore, 'classes'),
        where('enrollmentCode', '==', enrollmentCode)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Invalid enrollment code');
      }

      const classDoc = querySnapshot.docs[0];
      
      // Check if already enrolled
      const enrollmentQuery = query(
        collection(firestore, 'enrollments'),
        where('classId', '==', classDoc.id),
        where('userId', '==', currentUser.uid)
      );

      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      if (!enrollmentSnapshot.empty) {
        throw new Error('Already enrolled in this class');
      }

      // Create enrollment
      await addDoc(collection(firestore, 'enrollments'), {
        classId: classDoc.id,
        userId: currentUser.uid,
        role: 'student',
        joinedAt: serverTimestamp(),
      });

      await get().getEnrolledClasses();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to join class' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  leaveClass: async (classId: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Must be logged in to leave a class');

      const q = query(
        collection(firestore, 'enrollments'),
        where('classId', '==', classId),
        where('userId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await deleteDoc(querySnapshot.docs[0].ref);
      }

      await get().getEnrolledClasses();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to leave class' });
    } finally {
      set({ loading: false });
    }
  },

  getEnrolledClasses: async () => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Must be logged in to view enrolled classes');

      // Get user's enrollments
      const enrollmentsQuery = query(
        collection(firestore, 'enrollments'),
        where('userId', '==', currentUser.uid)
      );

      const enrollmentSnapshot = await getDocs(enrollmentsQuery);
      const classIds = enrollmentSnapshot.docs.map(doc => doc.data().classId);

      if (classIds.length === 0) {
        set({ enrolledClasses: [] });
        return;
      }

      // Get class details for enrolled classes
      const classesQuery = query(
        collection(firestore, 'classes'),
        where('_id', 'in', classIds)
      );

      const classesSnapshot = await getDocs(classesQuery);
      const classes = classesSnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Class[];

      set({ enrolledClasses: classes });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch enrolled classes' });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useSocialStore; 