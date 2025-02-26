import { create } from "zustand";
import axios from "axios";

export interface Note {
  _id: string; // MongoDB uses _id instead of id
  title: string;
  content: string;
  subjectId?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesStore {
  notes: Note[];
  fetchNotes: () => Promise<void>;
  addNote: (note: Omit<Note, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
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
      const response = await axios.post("http://localhost:5000/api/notes", note);
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
}));
