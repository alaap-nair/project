import { create } from 'zustand';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { firestore } from '../firebase.config';

export interface Subject {
  _id: string;
  name: string;
  color: string;
}

interface SubjectsStore {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  fetchSubjects: () => Promise<void>;
  addSubject: (subject: Omit<Subject, '_id'>) => Promise<Subject>;
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<Subject>;
  deleteSubject: (id: string) => Promise<boolean>;
}

export const useSubjectsStore = create<SubjectsStore>((set) => ({
  subjects: [],
  loading: false,
  error: null,

  fetchSubjects: async () => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(firestore, 'subjects'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const subjectsData = querySnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
      } as Subject));
      
      set({ subjects: subjectsData, loading: false });
    } catch (error) {
      console.error('Error fetching subjects:', error);
      set({ error: 'Failed to fetch subjects', loading: false });
      // Return empty array to prevent app crashes
      set({ subjects: [] });
    }
  },

  addSubject: async (subject) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(firestore, 'subjects'), {
        ...subject,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newSubject = {
        _id: docRef.id,
        ...subject
      };
      
      set((state) => ({
        subjects: [...state.subjects, newSubject],
        loading: false
      }));
      
      return newSubject;
    } catch (error) {
      console.error('Error adding subject:', error);
      set({ error: 'Failed to add subject', loading: false });
      throw error;
    }
  },

  updateSubject: async (id, updatedSubject) => {
    set({ loading: true, error: null });
    try {
      const subjectRef = doc(firestore, 'subjects', id);
      await updateDoc(subjectRef, {
        ...updatedSubject,
        updatedAt: serverTimestamp()
      });
      
      set((state) => ({
        subjects: state.subjects.map((subject) =>
          subject._id === id ? { ...subject, ...updatedSubject } : subject
        ),
        loading: false
      }));
      
      return { _id: id, ...updatedSubject } as Subject;
    } catch (error) {
      console.error('Error updating subject:', error);
      set({ error: 'Failed to update subject', loading: false });
      throw error;
    }
  },

  deleteSubject: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(firestore, 'subjects', id));
      
      set((state) => ({
        subjects: state.subjects.filter((subject) => subject._id !== id),
        loading: false
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting subject:', error);
      set({ error: 'Failed to delete subject', loading: false });
      throw error;
    }
  },
}));