import { create } from 'zustand';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { firestore } from '../firebase.config';
import { scheduleTaskReminder, cancelTaskReminder, updateTaskReminder } from '../services/notifications';
import { CalendarService } from '../services/calendar';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'study' | 'assignment' | 'exam' | 'reading' | 'project' | 'other';

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string;
  completed: boolean;
  reminderTime?: number; // minutes before due date
  notificationId?: string;
  noteIds: string[];  // Array of linked note IDs
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export type TimeframeFilter = 'today' | 'week' | 'month' | 'all';

export interface SummarizeOptions {
  category?: TaskCategory;
  priority?: TaskPriority;
  completed?: boolean;
  timeframe?: TimeframeFilter;
}

interface TasksStore {
  tasks: Task[];
  calendarSyncEnabled: boolean;
  calendarSyncError: string | null;
  calendarSyncRetrying: boolean;
  summarizing: boolean;
  summary: string | null;
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  setTaskReminder: (id: string, reminderTime: number) => Promise<void>;
  removeTaskReminder: (id: string) => Promise<void>;
  linkNoteToTask: (taskId: string, noteId: string) => Promise<void>;
  unlinkNoteFromTask: (taskId: string, noteId: string) => Promise<void>;
  initializeCalendarSync: () => Promise<void>;
  toggleCalendarSync: () => Promise<void>;
  retryCalendarSync: () => Promise<void>;
  clearCalendarSyncError: () => void;
  summarizeTasks: (options?: SummarizeOptions) => Promise<string>;
  clearSummary: () => void;
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  calendarSyncEnabled: false,
  calendarSyncError: null,
  calendarSyncRetrying: false,
  summarizing: false,
  summary: null,
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(firestore, 'tasks'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const tasksData = querySnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      } as Task));
      
      set({ tasks: tasksData, loading: false });

      // Reschedule notifications for all tasks with reminders
      tasksData.forEach(async (task: Task) => {
        if (task.reminderTime && !task.completed) {
          const notificationId = await scheduleTaskReminder(task, task.reminderTime);
          if (notificationId) {
            const taskRef = doc(firestore, 'tasks', task._id);
            await updateDoc(taskRef, {
              notificationId,
            });
          }
        }
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ error: 'Failed to fetch tasks', loading: false });
      // Return empty array instead of throwing to prevent app crashes
      set({ tasks: [] });
    }
  },

  initializeCalendarSync: async () => {
    try {
      set({ calendarSyncError: null, calendarSyncRetrying: false });
      const calendarService = CalendarService.getInstance();
      const success = await calendarService.initializeCalendarSync();
      
      if (success) {
        set({ calendarSyncEnabled: true });
        
        // Sync all existing tasks
        const state = get();
        await Promise.all(
          state.tasks.map(async task => {
            try {
              await calendarService.syncTaskWithCalendar(task);
            } catch (error) {
              console.error(`Error syncing task ${task._id}:`, error);
              throw new Error('Failed to sync some tasks with calendar');
            }
          })
        );
      } else {
        throw new Error('Calendar initialization failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during calendar sync';
      set({ 
        calendarSyncEnabled: false, 
        calendarSyncError: errorMessage,
        calendarSyncRetrying: false 
      });
      console.error('Error initializing calendar sync:', error);
    }
  },

  retryCalendarSync: async () => {
    try {
      set({ calendarSyncRetrying: true, calendarSyncError: null });
      await get().initializeCalendarSync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry calendar sync';
      set({ 
        calendarSyncError: errorMessage,
        calendarSyncEnabled: false 
      });
    } finally {
      set({ calendarSyncRetrying: false });
    }
  },

  clearCalendarSyncError: () => {
    set({ calendarSyncError: null });
  },

  toggleCalendarSync: async () => {
    const state = get();
    const newSyncEnabled = !state.calendarSyncEnabled;
    
    if (newSyncEnabled) {
      await state.initializeCalendarSync();
    } else {
      set({ 
        calendarSyncEnabled: false,
        calendarSyncError: null 
      });
    }
  },

  addTask: async (task) => {
    set({ loading: true, error: null });
    try {
      console.log('Preparing to add task:', task);
      
      // Schedule reminder if reminderTime is set
      let notificationId = null;
      if (task.reminderTime) {
        try {
          notificationId = await scheduleTaskReminder(task as Task, task.reminderTime);
          console.log('Scheduled notification with ID:', notificationId);
        } catch (notificationError) {
          console.error('Error scheduling notification:', notificationError);
          // Continue with task creation even if notification fails
        }
      }

      console.log('Adding task to Firestore:', { ...task, notificationId });
      
      const docRef = await addDoc(collection(firestore, 'tasks'), {
        ...task,
        noteIds: task.noteIds || [],
        notificationId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newTask = {
        _id: docRef.id,
        ...task,
        noteIds: task.noteIds || [],
        notificationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Task created successfully:', newTask);
      
      set((state) => ({
        tasks: [...state.tasks, newTask],
        loading: false
      }));

      // Sync with calendar if enabled
      if (get().calendarSyncEnabled) {
        try {
          const calendarService = CalendarService.getInstance();
          const syncSuccess = await calendarService.syncTaskWithCalendar(newTask);
          if (!syncSuccess) {
            throw new Error('Failed to sync task with calendar');
          }
        } catch (error) {
          console.error('Calendar sync error:', error);
          set({ calendarSyncError: 'Failed to sync new task with calendar' });
        }
      }
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      set({ error: 'Failed to add task', loading: false });
      throw error;
    }
  },

  updateTask: async (id, updatedTask) => {
    try {
      // Handle reminder updates
      if ('reminderTime' in updatedTask || 'dueDate' in updatedTask) {
        const state = get();
        const task = state.tasks.find((t) => t._id === id);
        if (task) {
          const newTask = { ...task, ...updatedTask };
          
          // Cancel existing reminder
          if (task.notificationId) {
            await cancelTaskReminder(task._id);
          }
          
          // Schedule new reminder if needed
          if (newTask.reminderTime && !newTask.completed) {
            const notificationId = await updateTaskReminder(newTask, newTask.reminderTime);
            if (notificationId) {
              updatedTask.notificationId = notificationId;
            }
          } else if ('reminderTime' in updatedTask && !updatedTask.reminderTime) {
            // If reminderTime is explicitly set to null/undefined, remove notification
            updatedTask.notificationId = null;
          }
        }
      }
      
      const taskRef = doc(firestore, 'tasks', id);
      await updateDoc(taskRef, {
        ...updatedTask,
        updatedAt: serverTimestamp()
      });
      
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task._id === id ? { 
            ...task, 
            ...updatedTask, 
            updatedAt: new Date().toISOString() 
          } : task
        ),
      }));
      
      // Sync with calendar if enabled
      if (get().calendarSyncEnabled) {
        try {
          const state = get();
          const updatedTaskObj = state.tasks.find(t => t._id === id);
          if (updatedTaskObj) {
            const calendarService = CalendarService.getInstance();
            await calendarService.syncTaskWithCalendar(updatedTaskObj);
          }
        } catch (error) {
          console.error('Calendar sync error during update:', error);
          set({ calendarSyncError: 'Failed to sync updated task with calendar' });
        }
      }
      
      return { _id: id, ...updatedTask };
    } catch (error) {
      console.error('Error updating task:', error);
      set({ error: 'Failed to update task' });
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      const state = get();
      const task = state.tasks.find(t => t._id === id);
      
      if (task) {
        // Cancel notification if exists
        if (task.notificationId) {
          await cancelTaskReminder(task._id);
        }
        
        // Delete from Firestore
        await deleteDoc(doc(firestore, 'tasks', id));
        
        set((state) => ({
          tasks: state.tasks.filter((task) => task._id !== id),
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ error: 'Failed to delete task' });
      throw error;
    }
  },

  toggleTaskCompletion: async (id) => {
    try {
      const state = get();
      const task = state.tasks.find(t => t._id === id);
      
      if (task) {
        const completed = !task.completed;
        
        // Update in Firestore
        const taskRef = doc(firestore, 'tasks', id);
        await updateDoc(taskRef, {
          completed,
          updatedAt: serverTimestamp()
        });
        
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === id ? { ...t, completed, updatedAt: new Date().toISOString() } : t
          ),
        }));
        
        // Handle notification based on completion status
        if (completed && task.notificationId) {
          await cancelTaskReminder(task._id);
        } else if (!completed && task.reminderTime) {
          const notificationId = await scheduleTaskReminder(task, task.reminderTime);
          if (notificationId) {
            await updateDoc(taskRef, { notificationId });
          }
        }
        
        // Sync with calendar if enabled
        if (get().calendarSyncEnabled) {
          try {
            const updatedTask = { ...task, completed };
            const calendarService = CalendarService.getInstance();
            await calendarService.syncTaskWithCalendar(updatedTask);
          } catch (error) {
            console.error('Calendar sync error during completion toggle:', error);
            set({ calendarSyncError: 'Failed to sync task completion status with calendar' });
          }
        }
        
        return completed;
      }
      return false;
    } catch (error) {
      console.error('Error toggling task completion:', error);
      set({ error: 'Failed to update task completion status' });
      throw error;
    }
  },

  setTaskReminder: async (id, reminderTime) => {
    try {
      const state = get();
      const task = state.tasks.find(t => t._id === id);
      
      if (task) {
        // Cancel existing reminder if any
        if (task.notificationId) {
          await cancelTaskReminder(task._id);
        }
        
        // Schedule new reminder
        const notificationId = await scheduleTaskReminder(task, reminderTime);
        
        // Update in Firestore
        const taskRef = doc(firestore, 'tasks', id);
        await updateDoc(taskRef, {
          reminderTime,
          notificationId,
          updatedAt: serverTimestamp()
        });
        
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === id ? { 
              ...t, 
              reminderTime, 
              notificationId, 
              updatedAt: new Date().toISOString() 
            } : t
          ),
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting task reminder:', error);
      set({ error: 'Failed to set task reminder' });
      throw error;
    }
  },

  removeTaskReminder: async (id) => {
    try {
      const state = get();
      const task = state.tasks.find(t => t._id === id);
      
      if (task && task.notificationId) {
        // Cancel notification
        await cancelTaskReminder(task._id);
        
        // Update in Firestore
        const taskRef = doc(firestore, 'tasks', id);
        await updateDoc(taskRef, {
          reminderTime: null,
          notificationId: null,
          updatedAt: serverTimestamp()
        });
        
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === id ? { 
              ...t, 
              reminderTime: null, 
              notificationId: null, 
              updatedAt: new Date().toISOString() 
            } : t
          ),
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing task reminder:', error);
      set({ error: 'Failed to remove task reminder' });
      throw error;
    }
  },

  linkNoteToTask: async (taskId, noteId) => {
    try {
      const state = get();
      const task = state.tasks.find(t => t._id === taskId);
      
      if (task) {
        const noteIds = [...(task.noteIds || [])];
        if (!noteIds.includes(noteId)) {
          noteIds.push(noteId);
          
          // Update in Firestore
          const taskRef = doc(firestore, 'tasks', taskId);
          await updateDoc(taskRef, {
            noteIds,
            updatedAt: serverTimestamp()
          });
          
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t._id === taskId ? { 
                ...t, 
                noteIds, 
                updatedAt: new Date().toISOString() 
              } : t
            ),
          }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error linking note to task:', error);
      set({ error: 'Failed to link note to task' });
      throw error;
    }
  },

  unlinkNoteFromTask: async (taskId, noteId) => {
    try {
      const state = get();
      const task = state.tasks.find(t => t._id === taskId);
      
      if (task) {
        const noteIds = (task.noteIds || []).filter(id => id !== noteId);
        
        // Update in Firestore
        const taskRef = doc(firestore, 'tasks', taskId);
        await updateDoc(taskRef, {
          noteIds,
          updatedAt: serverTimestamp()
        });
        
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === taskId ? { 
              ...t, 
              noteIds, 
              updatedAt: new Date().toISOString() 
            } : t
          ),
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unlinking note from task:', error);
      set({ error: 'Failed to unlink note from task' });
      throw error;
    }
  },

  summarizeTasks: async (options = {}) => {
    set({ summarizing: true, summary: null });
    try {
      const state = get();
      const { tasks } = state;
      
      // Filter tasks based on options
      let filteredTasks = [...tasks];
      
      if (options.category) {
        filteredTasks = filteredTasks.filter(task => task.category === options.category);
      }
      
      if (options.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === options.priority);
      }
      
      if (options.completed !== undefined) {
        filteredTasks = filteredTasks.filter(task => task.completed === options.completed);
      }
      
      if (options.timeframe) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (options.timeframe) {
          case 'today':
            filteredTasks = filteredTasks.filter(task => {
              const dueDate = new Date(task.dueDate);
              return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
            });
            break;
          case 'week':
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            filteredTasks = filteredTasks.filter(task => {
              const dueDate = new Date(task.dueDate);
              return dueDate >= today && dueDate < weekEnd;
            });
            break;
          case 'month':
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            filteredTasks = filteredTasks.filter(task => {
              const dueDate = new Date(task.dueDate);
              return dueDate >= today && dueDate < monthEnd;
            });
            break;
          // 'all' doesn't need filtering
        }
      }
      
      // Generate summary text
      let summaryText = '';
      
      if (filteredTasks.length === 0) {
        summaryText = 'No tasks match the selected criteria.';
      } else {
        // Group by category
        const tasksByCategory: Record<string, Task[]> = {};
        
        filteredTasks.forEach(task => {
          if (!tasksByCategory[task.category]) {
            tasksByCategory[task.category] = [];
          }
          tasksByCategory[task.category].push(task);
        });
        
        // Build summary text
        summaryText = `Task Summary (${filteredTasks.length} tasks):\n\n`;
        
        Object.entries(tasksByCategory).forEach(([category, tasks]) => {
          summaryText += `${category.charAt(0).toUpperCase() + category.slice(1)} (${tasks.length}):\n`;
          
          // Sort by priority and due date
          tasks.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          });
          
          tasks.forEach(task => {
            const dueDate = new Date(task.dueDate).toLocaleDateString();
            const status = task.completed ? '✓' : '○';
            const priority = task.priority === 'high' ? '⚠️' : task.priority === 'medium' ? '⚠' : '•';
            
            summaryText += `  ${status} ${priority} ${task.title} (Due: ${dueDate})\n`;
          });
          
          summaryText += '\n';
        });
      }
      
      set({ summary: summaryText, summarizing: false });
      return summaryText;
    } catch (error) {
      console.error('Error summarizing tasks:', error);
      set({ error: 'Failed to generate task summary', summarizing: false });
      return 'Error generating summary.';
    }
  },

  clearSummary: () => {
    set({ summary: null });
  }
})); 