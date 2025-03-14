import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../store/tasks';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
  let token;

  if (Platform.OS !== 'web') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export async function scheduleTaskReminder(task: Partial<Task>, reminderTime: number): Promise<string | null> {
  try {
    // If this is an existing task with an ID, cancel any existing notifications
    if (task._id) {
      await cancelTaskReminder(task._id);
    }

    // Make sure we have a deadline
    if (!task.deadline) {
      console.error('Cannot schedule reminder: Task has no deadline');
      return null;
    }

    // Use deadline instead of dueDate
    const dueDate = new Date(task.deadline);
    const notificationDate = new Date(dueDate.getTime() - (reminderTime * 60 * 1000));

    // Don't schedule if the notification time has passed
    if (notificationDate <= new Date()) {
      return null;
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Due Soon!',
        body: `"${task.title}" is due in ${reminderTime} minutes`,
        data: { taskId: task._id || 'new-task' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: notificationDate,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling task reminder:', error);
    return null;
  }
}

export async function cancelTaskReminder(taskId: string) {
  try {
    // Get all scheduled notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Find notifications for this task
    const taskNotifications = scheduledNotifications.filter(
      notification => notification.content.data?.taskId === taskId
    );
    
    // Cancel each notification
    for (const notification of taskNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.error('Error canceling task reminder:', error);
  }
}

export async function updateTaskReminder(task: Task, reminderTime: number) {
  // Simply re-schedule the reminder
  return scheduleTaskReminder(task, reminderTime);
} 