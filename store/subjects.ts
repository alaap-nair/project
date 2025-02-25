import { create } from 'zustand';

export interface Subject {
  id: string;
  name: string;
  color: string;
}

interface SubjectsStore {
  subjects: Subject[];
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
}

export const useSubjectsStore = create<SubjectsStore>((set) => ({
  subjects: [],
  addSubject: (subject) => {
    set((state) => ({
      subjects: [
        ...state.subjects,
        {
          ...subject,
          id: Math.random().toString(36).substring(7),
        },
      ],
    }));
  },
  updateSubject: (id, updatedSubject) => {
    set((state) => ({
      subjects: state.subjects.map((subject) =>
        subject.id === id ? { ...subject, ...updatedSubject } : subject
      ),
    }));
  },
  deleteSubject: (id) => {
    set((state) => ({
      subjects: state.subjects.filter((subject) => subject.id !== id),
    }));
  },
}));