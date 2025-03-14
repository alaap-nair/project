import { create } from 'zustand';
import { API_URL, apiClient } from '../config';
import { handleApiError } from '../utils/apiUtils';

export interface Note {
  _id: string;
  title: string;
  content: string;
  subjectId?: string;
  audioUrl?: string;
  transcript?: string;
  taskIds: string[];  // Array of linked task IDs
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
  linkTaskToNote: (noteId: string, taskId: string) => Promise<void>;
  unlinkTaskFromNote: (noteId: string, taskId: string) => Promise<void>;
}

// Create the store
const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/api/notes`);
      set({ notes: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching notes:', error);
      const errorMessage = handleApiError(error, 'Failed to fetch notes');
      set({ error: errorMessage, loading: false });
      // Return empty array to prevent app crashes
      set({ notes: [] });
    }
  },

  addNote: async (note) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post(`/api/notes`, {
        ...note,
        taskIds: [],
      });
      set((state) => ({
        notes: [...state.notes, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      console.error('Error adding note:', error);
      const errorMessage = handleApiError(error, 'Failed to add note');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateNote: async (id, updatedNote) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch(`/api/notes/${id}`, updatedNote);
      set((state) => ({
        notes: state.notes.map((note) =>
          note._id === id ? { ...note, ...response.data } : note
        ),
        loading: false
      }));
      return response.data;
    } catch (error) {
      console.error('Error updating note:', error);
      const errorMessage = handleApiError(error, 'Failed to update note');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteNote: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/api/notes/${id}`);
      set((state) => ({
        notes: state.notes.filter((note) => note._id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting note:', error);
      const errorMessage = handleApiError(error, 'Failed to delete note');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  linkTaskToNote: async (noteId: string, taskId: string) => {
    try {
      const state = useNotesStore.getState();
      const note = state.notes.find((n) => n._id === noteId);
      
      if (note) {
        const taskIds = [...(note.taskIds || [])];
        if (!taskIds.includes(taskId)) {
          taskIds.push(taskId);
          await apiClient.patch(`/api/notes/${noteId}`, {
            taskIds,
          });
          
          set((state) => ({
            notes: state.notes.map((n) =>
              n._id === noteId ? { ...n, taskIds } : n
            ),
          }));
        }
      }
    } catch (error) {
      console.error("Error linking task to note:", error);
      handleApiError(error, "Error linking task to note");
    }
  },

  unlinkTaskFromNote: async (noteId: string, taskId: string) => {
    try {
      const state = useNotesStore.getState();
      const note = state.notes.find((n) => n._id === noteId);
      
      if (note) {
        const taskIds = (note.taskIds || []).filter(id => id !== taskId);
        await apiClient.patch(`/api/notes/${noteId}`, {
          taskIds,
        });
        
        set((state) => ({
          notes: state.notes.map((n) =>
            n._id === noteId ? { ...n, taskIds } : n
          ),
        }));
      }
    } catch (error) {
      console.error("Error unlinking task from note:", error);
      handleApiError(error, "Error unlinking task from note");
    }
  },
}));

// Export the store
export { useNotesStore };
