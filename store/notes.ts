import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../config';

export interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesStore {
  notes: Note[];
  loading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  addNote: (note: Omit<Note, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updatedNote: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

// Create the store
const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/api/notes`);
      set({ notes: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching notes:', error);
      set({ error: 'Failed to fetch notes', loading: false });
    }
  },

  addNote: async (note) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/notes`, note);
      set((state) => ({
        notes: [...state.notes, response.data],
        loading: false
      }));
    } catch (error) {
      console.error('Error adding note:', error);
      set({ error: 'Failed to add note', loading: false });
    }
  },

  updateNote: async (id, updatedNote) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.patch(`${API_URL}/api/notes/${id}`, updatedNote);
      set((state) => ({
        notes: state.notes.map((note) =>
          note._id === id ? { ...note, ...response.data } : note
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating note:', error);
      set({ error: 'Failed to update note', loading: false });
    }
  },

  deleteNote: async (id) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${API_URL}/api/notes/${id}`);
      set((state) => ({
        notes: state.notes.filter((note) => note._id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting note:', error);
      set({ error: 'Failed to delete note', loading: false });
    }
  }
}));

// Export the store
export { useNotesStore };
