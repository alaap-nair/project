import { Platform } from 'react-native';
import { Task } from '../store/tasks';

// Common reminder times in minutes
export const REMINDER_TIMES = [
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '1 day', value: 1440 },
];

export async function registerForPushNotificationsAsync() {
  console.log('Push notifications are not available in Expo Go. Use a development build for full notification support.');
  return null;
}

export async function scheduleTaskReminder(task: Partial<Task>, reminderTime: number): Promise<string | null> {
  console.log('Task reminders are not available in Expo Go. Use a development build for full notification support.');
  console.log(`Would schedule reminder for "${task.title}" ${reminderTime} minutes before deadline`);
  return null;
}

export async function cancelTaskReminder(taskId: string) {
  console.log('Task reminders are not available in Expo Go. Use a development build for full notification support.');
  console.log(`Would cancel reminder for task ${taskId}`);
}

export async function updateTaskReminder(task: Task, reminderTime: number) {
  console.log('Task reminders are not available in Expo Go. Use a development build for full notification support.');
  console.log(`Would update reminder for "${task.title}" to ${reminderTime} minutes before deadline`);
  return null;
} 