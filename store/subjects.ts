import { create } from 'zustand';
import { API_URL, apiClient } from '../config';
import { handleApiError } from '../utils/apiUtils';

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
  addSubject: (subject: Omit<Subject, '_id'>) => Promise<void>;
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
}

export const useSubjectsStore = create<SubjectsStore>((set) => ({
  subjects: [],
  loading: false,
  error: null,

  fetchSubjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/api/subjects`);
      set({ subjects: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching subjects:', error);
      const errorMessage = handleApiError(error, 'Failed to fetch subjects');
      set({ error: errorMessage, loading: false });
      // Return empty array to prevent app crashes
      set({ subjects: [] });
    }
  },

  addSubject: async (subject) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post(`/api/subjects`, subject);
      set((state) => ({
        subjects: [...state.subjects, response.data],
        loading: false
      }));
    } catch (error) {
      console.error('Error adding subject:', error);
      const errorMessage = handleApiError(error, 'Failed to add subject');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateSubject: async (id, updatedSubject) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put(`/api/subjects/${id}`, updatedSubject);
      set((state) => ({
        subjects: state.subjects.map((subject) =>
          subject._id === id ? { ...subject, ...response.data } : subject
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating subject:', error);
      const errorMessage = handleApiError(error, 'Failed to update subject');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteSubject: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/api/subjects/${id}`);
      set((state) => ({
        subjects: state.subjects.filter((subject) => subject._id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting subject:', error);
      const errorMessage = handleApiError(error, 'Failed to delete subject');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));