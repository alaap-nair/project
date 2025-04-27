import { create } from 'zustand';

interface TaskModalStore {
  showTaskModal: boolean;
  setShowTaskModal: (show: boolean) => void;
}

export const useTaskModalStore = create<TaskModalStore>((set) => ({
  showTaskModal: false,
  setShowTaskModal: (show) => set({ showTaskModal: show }),
})); 