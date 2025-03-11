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

export async function scheduleTaskReminder(task: Task, reminderTime: number) {
  // Cancel any existing notifications for this task
  await cancelTaskReminder(task._id);

  // Calculate notification time (reminderTime minutes before due date)
  const dueDate = new Date(task.dueDate);
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
      data: { taskId: task._id },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      date: notificationDate,
    },
  });

  return notificationId;
}

export async function cancelTaskReminder(taskId: string) {
  // Get all scheduled notifications
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  
  // Find and cancel notifications for this task
  for (const notification of notifications) {
    if (notification.content.data?.taskId === taskId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export async function updateTaskReminder(task: Task, reminderTime: number) {
  return await scheduleTaskReminder(task, reminderTime);
}

// Default reminder times (in minutes)
export const REMINDER_TIMES = [
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '1 day', value: 1440 },
]; 