import { create } from 'zustand';
import axios from 'axios';
import { scheduleTaskReminder, cancelTaskReminder, updateTaskReminder } from '../services/notifications';
import { CalendarService } from '../services/calendar';
import { API_URL, apiClient } from '../config';
import { handleApiError } from '../utils/apiUtils';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'study' | 'homework' | 'exam' | 'project' | 'other';

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  deadline: string;
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
      const response = await apiClient.get('/api/tasks');
      set({ tasks: response.data, loading: false });

      // Reschedule notifications for all tasks with reminders
      response.data.forEach(async (task: Task) => {
        if (task.reminderTime && !task.completed) {
          const notificationId = await scheduleTaskReminder(task, task.reminderTime);
          if (notificationId) {
            await apiClient.patch(`/api/tasks/${task._id}`, {
              notificationId,
            });
          }
        }
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      const errorMessage = handleApiError(error, 'Failed to fetch tasks');
      set({ error: errorMessage, loading: false });
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

      console.log('Sending task to API:', { ...task, notificationId });
      
      // Add retry logic for network errors
      let response;
      let retries = 3;
      
      while (retries > 0) {
        try {
          response = await apiClient.post('/api/tasks', {
            ...task,
            notificationId,
          });
          break; // If successful, break out of the retry loop
        } catch (error: any) {
          if (error.message && error.message.includes('Network Error') && retries > 1) {
            console.log(`Network error, retrying... (${retries - 1} attempts left)`);
            retries--;
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            // If it's not a network error or we're out of retries, rethrow
            throw error;
          }
        }
      }

      if (!response) {
        throw new Error('Failed to create task after multiple attempts');
      }

      const newTask = response.data;
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
      const errorMessage = handleApiError(error, 'Failed to add task');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateTask: async (id, updatedTask) => {
    try {
      // Handle reminder updates
      if ('reminderTime' in updatedTask || 'deadline' in updatedTask) {
        const state = get();
        const task = state.tasks.find((t) => t._id === id);
        if (task) {
          const newTask = { ...task, ...updatedTask };
          if (newTask.reminderTime) {
            const notificationId = await updateTaskReminder(newTask, newTask.reminderTime);
            updatedTask.notificationId = notificationId;
          }
        }
      }

      await apiClient.patch(`/api/tasks/${id}`, updatedTask);
      
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task._id === id ? { ...task, ...updatedTask } : task
        ),
      }));

      // Sync with calendar if enabled
      if (get().calendarSyncEnabled) {
        try {
          const state = get();
          const updatedTaskFull = state.tasks.find(t => t._id === id);
          if (updatedTaskFull) {
            const calendarService = CalendarService.getInstance();
            const syncSuccess = await calendarService.syncTaskWithCalendar(updatedTaskFull);
            if (!syncSuccess) {
              throw new Error('Failed to sync updated task with calendar');
            }
          }
        } catch (error) {
          console.error('Calendar sync error:', error);
          set({ calendarSyncError: 'Failed to sync task update with calendar' });
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      // Cancel any existing reminders
      await cancelTaskReminder(id);
      
      // Delete from calendar if enabled
      if (get().calendarSyncEnabled) {
        const state = get();
        const task = state.tasks.find(t => t._id === id);
        if (task) {
          const calendarService = CalendarService.getInstance();
          await calendarService.syncTaskWithCalendar({ ...task, completed: true });
        }
      }

      await apiClient.delete(`/api/tasks/${id}`);
      set((state) => ({
        tasks: state.tasks.filter((task) => task._id !== id),
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  toggleTaskCompletion: async (id) => {
    try {
      const state = get();
      const task = state.tasks.find((t) => t._id === id);
      if (!task) {
        console.error('Task not found');
        return;
      }

      // First update the UI optimistically for better user experience
      const updatedTask = { ...task, completed: !task.completed };
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === id ? updatedTask : t
        ),
      }));

      // Handle reminders
      if (!task.completed && task.notificationId) {
        await cancelTaskReminder(id);
      } else if (task.completed && task.reminderTime) {
        const notificationId = await scheduleTaskReminder(task, task.reminderTime);
        if (notificationId) {
          await apiClient.patch(`/api/tasks/${id}`, {
            completed: !task.completed,
            notificationId,
          });
        }
      } else {
        // Simple completion toggle without notification changes
        await apiClient.patch(`/api/tasks/${id}`, {
          completed: !task.completed,
        });
      }

      // Sync with calendar if enabled
      if (get().calendarSyncEnabled) {
        const calendarService = CalendarService.getInstance();
        await calendarService.syncTaskWithCalendar(updatedTask);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      
      // Revert the optimistic update if the API call fails
      const state = get();
      const originalTask = state.tasks.find((t) => t._id === id);
      if (originalTask) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === id ? { ...t, completed: !t.completed } : t
          ),
        }));
      }
      
      // Re-throw the error so it can be handled by the UI
      throw error;
    }
  },

  setTaskReminder: async (id, reminderTime) => {
    try {
      const state = get();
      const task = state.tasks.find((t) => t._id === id);
      if (task) {
        const notificationId = await scheduleTaskReminder(task, reminderTime);
        await apiClient.patch(`/api/tasks/${id}`, {
          reminderTime,
          notificationId,
        });
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === id ? { ...t, reminderTime, notificationId } : t
          ),
        }));
      }
    } catch (error) {
      console.error('Error setting task reminder:', error);
    }
  },

  removeTaskReminder: async (id) => {
    try {
      await cancelTaskReminder(id);
      await apiClient.patch(`/api/tasks/${id}`, {
        reminderTime: null,
        notificationId: null,
      });
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === id ? { ...t, reminderTime: null, notificationId: null } : t
        ),
      }));
    } catch (error) {
      console.error('Error removing task reminder:', error);
    }
  },

  linkNoteToTask: async (taskId: string, noteId: string) => {
    try {
      const state = get();
      const task = state.tasks.find((t) => t._id === taskId);
      
      if (task) {
        const noteIds = [...(task.noteIds || [])];
        if (!noteIds.includes(noteId)) {
          noteIds.push(noteId);
          await apiClient.patch(`/api/tasks/${taskId}`, {
            noteIds,
          });
          
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t._id === taskId ? { ...t, noteIds } : t
            ),
          }));
        }
      }
    } catch (error) {
      console.error('Error linking note to task:', error);
    }
  },

  unlinkNoteFromTask: async (taskId: string, noteId: string) => {
    try {
      const state = get();
      const task = state.tasks.find((t) => t._id === taskId);
      
      if (task) {
        const noteIds = (task.noteIds || []).filter(id => id !== noteId);
        await apiClient.patch(`/api/tasks/${taskId}`, {
          noteIds,
        });
        
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === taskId ? { ...t, noteIds } : t
          ),
        }));
      }
    } catch (error) {
      console.error('Error unlinking note from task:', error);
    }
  },

  summarizeTasks: async (options = {}) => {
    set({ summarizing: true, summary: null });
    try {
      const response = await apiClient.post(`/api/tasks/summarize`, options);
      const summary = response.data.summary;
      set({ summary, summarizing: false });
      return summary;
    } catch (error) {
      console.error('Error summarizing tasks:', error);
      set({ summarizing: false });
      return 'Failed to generate summary.';
    }
  },

  clearSummary: () => {
    set({ summary: null });
  },
})); 