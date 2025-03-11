import { create } from "zustand";
import axios from "axios";

export interface Note {
  _id: string; // MongoDB uses _id instead of id
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
  fetchNotes: () => Promise<void>;
  addNote: (note: Omit<Note, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  linkTaskToNote: (noteId: string, taskId: string) => Promise<void>;
  unlinkTaskFromNote: (noteId: string, taskId: string) => Promise<void>;
}

export const useNotesStore = create<NotesStore>((set) => ({
  notes: [],

  // ✅ Fetch notes from backend
  fetchNotes: async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/notes");
      set({ notes: response.data });
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  },

  // ✅ Add a new note via backend
  addNote: async (note) => {
    try {
      const response = await axios.post("http://localhost:5000/api/notes", {
        ...note,
        taskIds: [],
      });
      set((state) => ({
        notes: [...state.notes, response.data],
      }));
    } catch (error) {
      console.error("Error adding note:", error);
    }
  },

  // ✅ Update note in backend
  updateNote: async (id, updatedNote) => {
    try {
      await axios.patch(`http://localhost:5000/api/notes/${id}`, updatedNote);
      set((state) => ({
        notes: state.notes.map((note) =>
          note._id === id ? { ...note, ...updatedNote } : note
        ),
      }));
    } catch (error) {
      console.error("Error updating note:", error);
    }
  },

  // ✅ Delete note in backend
  deleteNote: async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/notes/${id}`);
      set((state) => ({
        notes: state.notes.filter((note) => note._id !== id),
      }));
    } catch (error) {
      console.error("Error deleting note:", error);
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
          await axios.patch(`http://localhost:5000/api/notes/${noteId}`, {
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
    }
  },

  unlinkTaskFromNote: async (noteId: string, taskId: string) => {
    try {
      const state = useNotesStore.getState();
      const note = state.notes.find((n) => n._id === noteId);
      
      if (note) {
        const taskIds = (note.taskIds || []).filter(id => id !== taskId);
        await axios.patch(`http://localhost:5000/api/notes/${noteId}`, {
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
    }
  },
}));
