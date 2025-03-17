import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase.config';

// Sample subjects
const sampleSubjects = [
  { name: 'Mathematics', color: '#FF5733' },
  { name: 'Computer Science', color: '#33FF57' },
  { name: 'Physics', color: '#3357FF' },
  { name: 'English', color: '#F033FF' },
  { name: 'History', color: '#FF9933' }
];

// Sample tasks
const sampleTasks = [
  {
    title: 'Complete Calculus Assignment',
    description: 'Finish problems 1-10 from Chapter 5',
    priority: 'high',
    category: 'assignment',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    completed: false,
    noteIds: []
  },
  {
    title: 'Study for Physics Exam',
    description: 'Review chapters 7-9 on Thermodynamics',
    priority: 'high',
    category: 'exam',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    completed: false,
    noteIds: []
  },
  {
    title: 'Read History Chapter',
    description: 'Read Chapter 12 on World War II',
    priority: 'medium',
    category: 'reading',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    completed: false,
    noteIds: []
  }
];

// Sample notes
const sampleNotes = [
  {
    title: 'Calculus Notes',
    content: 'Integration by parts: ∫u dv = uv - ∫v du\n\nRemember to identify u and dv carefully.',
    taskIds: []
  },
  {
    title: 'Physics Formulas',
    content: 'F = ma\nE = mc²\nPV = nRT',
    taskIds: []
  },
  {
    title: 'History Timeline',
    content: '1939: World War II begins\n1941: Pearl Harbor\n1945: End of World War II',
    taskIds: []
  }
];

/**
 * Checks if sample data already exists in Firestore
 */
const checkIfSampleDataExists = async (): Promise<boolean> => {
  try {
    // Check if any subjects exist
    const subjectsQuery = query(collection(firestore, 'subjects'), where('name', '==', 'Mathematics'));
    const subjectsSnapshot = await getDocs(subjectsQuery);
    
    return !subjectsSnapshot.empty;
  } catch (error) {
    console.error('Error checking for sample data:', error);
    return false;
  }
};

/**
 * Initializes Firestore with sample data if it doesn't exist
 */
export const initializeSampleData = async (): Promise<void> => {
  try {
    // Check if sample data already exists
    const dataExists = await checkIfSampleDataExists();
    
    if (dataExists) {
      console.log('Sample data already exists, skipping initialization');
      return;
    }
    
    console.log('Initializing sample data...');
    
    // Add sample subjects
    const subjectIds = await Promise.all(
      sampleSubjects.map(async (subject) => {
        const docRef = await addDoc(collection(firestore, 'subjects'), {
          ...subject,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return docRef.id;
      })
    );
    
    // Add sample notes
    const noteIds = await Promise.all(
      sampleNotes.map(async (note) => {
        const docRef = await addDoc(collection(firestore, 'notes'), {
          ...note,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return docRef.id;
      })
    );
    
    // Add sample tasks
    await Promise.all(
      sampleTasks.map(async (task, index) => {
        // Link first task to first note
        const taskNoteIds = index === 0 ? [noteIds[0]] : [];
        
        const docRef = await addDoc(collection(firestore, 'tasks'), {
          ...task,
          noteIds: taskNoteIds,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // If we linked a note to this task, update the note with the task ID
        if (taskNoteIds.length > 0) {
          const noteRef = collection(firestore, 'notes');
          const noteDoc = await getDocs(query(noteRef, where('__name__', '==', noteIds[0])));
          
          if (!noteDoc.empty) {
            const note = noteDoc.docs[0];
            await addDoc(collection(firestore, 'notes'), {
              ...note.data(),
              taskIds: [docRef.id],
              updatedAt: serverTimestamp()
            });
          }
        }
        
        return docRef.id;
      })
    );
    
    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}; 