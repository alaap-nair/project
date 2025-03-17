import { create } from 'zustand';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { firestore } from '../firebase.config';

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
      const q = query(collection(firestore, 'notes'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const notesData = querySnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
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
      const docRef = await addDoc(collection(firestore, 'notes'), {
        ...note,
        taskIds: note.taskIds || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newNote = {
        _id: docRef.id,
        ...note,
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
      const noteRef = doc(firestore, 'notes', id);
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
      await deleteDoc(doc(firestore, 'notes', id));
      
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
      const state = useNotesStore.getState();
      const note = state.notes.find((n) => n._id === noteId);
      
      if (note) {
        const taskIds = [...(note.taskIds || [])];
        if (!taskIds.includes(taskId)) {
          taskIds.push(taskId);
          
          const noteRef = doc(firestore, 'notes', noteId);
          await updateDoc(noteRef, { taskIds });
          
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
        
        const noteRef = doc(firestore, 'notes', noteId);
        await updateDoc(noteRef, { taskIds });
        
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

  addAudioToNote: async (noteId: string, audioUrl: string) => {
    set({ loading: true, error: null });
    try {
      console.log('Saving audio URL to note:', noteId, audioUrl);
      
      // Ensure the audio URL is properly formatted
      let processedAudioUrl = audioUrl;
      
      // For stored URIs, we want to ensure they can be accessed across sessions
      // This may require different handling based on your storage solution
      // For now, we'll just log the URI format for debugging
      
      const noteRef = doc(firestore, 'notes', noteId);
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
      const noteRef = doc(firestore, 'notes', noteId);
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

// Export the store
export { useNotesStore };
