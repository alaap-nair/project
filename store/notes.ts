import { create } from 'zustand';
import { format } from 'date-fns';

export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesStore {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

export const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  addNote: (note) => {
    const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    set((state) => ({
      notes: [
        ...state.notes,
        {
          ...note,
          id: Math.random().toString(36).substring(7),
          createdAt: now,
          updatedAt: now,
        },
      ],
    }));
  },
  updateNote: (id, updatedNote) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updatedNote, updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }
          : note
      ),
    }));
  },
  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    }));
  },
}));