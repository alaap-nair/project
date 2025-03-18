import { create } from 'zustand';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from './auth';

export interface Note {
  _id: string;
  userId: string; // Add userId field to associate notes with users
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
  addNote: (note: Omit<Note, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updatedNote: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  linkTaskToNote: (noteId: string, taskId: string) => Promise<void>;
  unlinkTaskFromNote: (noteId: string, taskId: string) => Promise<void>;
  addAudioToNote: (noteId: string, audioUrl: string) => Promise<void>;
  addTranscriptToNote: (noteId: string, transcript: string) => Promise<void>;
}

// Create the store
const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        console.error('No authenticated user found');
        set({ error: 'You must be logged in to view notes', loading: false });
        set({ notes: [] });
        return;
      }
      
      // Query notes that belong to the current user
      const q = query(
        collection(db, 'notes'), 
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const notesData = querySnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ? 
          doc.data().createdAt.toDate().toISOString() : 
          new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.() ? 
          doc.data().updatedAt.toDate().toISOString() : 
          new Date().toISOString(),
      } as Note));
      
      set({ notes: notesData, loading: false });
    } catch (error) {
      console.error('Error fetching notes:', error);
      set({ error: 'Failed to fetch notes', loading: false });
      // Return empty array to prevent app crashes
      set({ notes: [] });
    }
  },

  addNote: async (note) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        throw new Error('You must be logged in to create notes');
      }
      
      const docRef = await addDoc(collection(db, 'notes'), {
        ...note,
        userId: currentUser.uid, // Associate note with current user
        taskIds: note.taskIds || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newNote = {
        _id: docRef.id,
        ...note,
        userId: currentUser.uid,
        taskIds: note.taskIds || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set((state) => ({
        notes: [newNote, ...state.notes],
        loading: false
      }));
      
      return newNote;
    } catch (error) {
      console.error('Error adding note:', error);
      set({ error: 'Failed to add note', loading: false });
      throw error;
    }
  },

  updateNote: async (id, updatedNote) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        throw new Error('You must be logged in to update notes');
      }
      
      // First check if the note belongs to the current user
      const state = useNotesStore.getState();
      const noteToUpdate = state.notes.find(note => note._id === id);
      
      if (!noteToUpdate) {
        throw new Error('Note not found');
      }
      
      if (noteToUpdate.userId !== currentUser.uid) {
        throw new Error('You do not have permission to update this note');
      }
      
      const noteRef = doc(db, 'notes', id);
      await updateDoc(noteRef, {
        ...updatedNote,
        updatedAt: serverTimestamp()
      });
      
      set((state) => ({
        notes: state.notes.map((note) =>
          note._id === id ? { 
            ...note, 
            ...updatedNote, 
            updatedAt: new Date().toISOString() 
          } : note
        ),
        loading: false
      }));
      
      return { _id: id, ...updatedNote };
    } catch (error) {
      console.error('Error updating note:', error);
      set({ error: 'Failed to update note', loading: false });
      throw error;
    }
  },

  deleteNote: async (id) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        throw new Error('You must be logged in to delete notes');
      }
      
      // First check if the note belongs to the current user
      const state = useNotesStore.getState();
      const noteToDelete = state.notes.find(note => note._id === id);
      
      if (!noteToDelete) {
        throw new Error('Note not found');
      }
      
      if (noteToDelete.userId !== currentUser.uid) {
        throw new Error('You do not have permission to delete this note');
      }
      
      await deleteDoc(doc(db, 'notes', id));
      
      set((state) => ({
        notes: state.notes.filter((note) => note._id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting note:', error);
      set({ error: 'Failed to delete note', loading: false });
      throw error;
    }
  },

  linkTaskToNote: async (noteId: string, taskId: string) => {
    try {
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        throw new Error('You must be logged in to link tasks to notes');
      }
      
      const state = useNotesStore.getState();
      const note = state.notes.find((n) => n._id === noteId);
      
      if (!note) {
        throw new Error('Note not found');
      }
      
      if (note.userId !== currentUser.uid) {
        throw new Error('You do not have permission to modify this note');
      }
      
      const taskIds = [...(note.taskIds || [])];
      if (!taskIds.includes(taskId)) {
        taskIds.push(taskId);
        
        const noteRef = doc(db, 'notes', noteId);
        await updateDoc(noteRef, { 
          taskIds,
          updatedAt: serverTimestamp()
        });
        
        set((state) => ({
          notes: state.notes.map((n) =>
            n._id === noteId ? { 
              ...n, 
              taskIds,
              updatedAt: new Date().toISOString()
            } : n
          ),
        }));
      }
    } catch (error) {
      console.error("Error linking task to note:", error);
    }
  },

  unlinkTaskFromNote: async (noteId: string, taskId: string) => {
    try {
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        throw new Error('You must be logged in to unlink tasks from notes');
      }
      
      const state = useNotesStore.getState();
      const note = state.notes.find((n) => n._id === noteId);
      
      if (!note) {
        throw new Error('Note not found');
      }
      
      if (note.userId !== currentUser.uid) {
        throw new Error('You do not have permission to modify this note');
      }
      
      const taskIds = (note.taskIds || []).filter(id => id !== taskId);
      
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, { 
        taskIds,
        updatedAt: serverTimestamp()
      });
      
      set((state) => ({
        notes: state.notes.map((n) =>
          n._id === noteId ? { 
            ...n, 
            taskIds,
            updatedAt: new Date().toISOString()
          } : n
        ),
      }));
    } catch (error) {
      console.error("Error unlinking task from note:", error);
    }
  },

  addAudioToNote: async (noteId: string, audioUrl: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        throw new Error('You must be logged in to add audio to notes');
      }
      
      // Verify the note belongs to the current user
      const state = useNotesStore.getState();
      const note = state.notes.find(n => n._id === noteId);
      
      if (!note) {
        throw new Error('Note not found');
      }
      
      if (note.userId !== currentUser.uid) {
        throw new Error('You do not have permission to modify this note');
      }
      
      console.log('Saving audio URL to note:', noteId, audioUrl);
      
      // Process the audio URL if needed
      let processedAudioUrl = audioUrl;
      
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, {
        audioUrl: processedAudioUrl,
        updatedAt: serverTimestamp()
      });
      
      console.log('Audio URL saved successfully');
      
      set((state) => ({
        notes: state.notes.map((note) =>
          note._id === noteId ? { 
            ...note, 
            audioUrl: processedAudioUrl, 
            updatedAt: new Date().toISOString() 
          } : note
        ),
        loading: false
      }));
      
      return { _id: noteId, audioUrl: processedAudioUrl };
    } catch (error) {
      console.error('Error adding audio to note:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      set({ error: 'Failed to add audio to note', loading: false });
      throw error;
    }
  },

  addTranscriptToNote: async (noteId: string, transcript: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        throw new Error('You must be logged in to add transcripts to notes');
      }
      
      // Verify the note belongs to the current user
      const state = useNotesStore.getState();
      const note = state.notes.find(n => n._id === noteId);
      
      if (!note) {
        throw new Error('Note not found');
      }
      
      if (note.userId !== currentUser.uid) {
        throw new Error('You do not have permission to modify this note');
      }
      
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, {
        transcript,
        updatedAt: serverTimestamp()
      });
      
      set((state) => ({
        notes: state.notes.map((note) =>
          note._id === noteId ? { 
            ...note, 
            transcript, 
            updatedAt: new Date().toISOString() 
          } : note
        ),
        loading: false
      }));
      
      return { _id: noteId, transcript };
    } catch (error) {
      console.error('Error adding transcript to note:', error);
      set({ error: 'Failed to add transcript to note', loading: false });
      throw error;
    }
  },
}));

export default useNotesStore;
