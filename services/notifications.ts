import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

/**
 * Schedule a daily reminder for a habit at the specified time.
 * Returns the notification identifier.
 */
export async function scheduleDailyReminder(params: {
  habitId: string;
  habitName: string;
  reminderTime: string; // "HH:MM"
}): Promise<string> {
  const [hour, minute] = params.reminderTime.split(':').map(Number);

  // Cancel existing notification for this habit if any
  await cancelHabitReminder(params.habitId);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time for: ${params.habitName}`,
      body: `Stay consistent — complete your habit now!`,
      data: { habitId: params.habitId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return notificationId;
}

/**
 * Cancel all scheduled notifications for a habit.
 * Uses a stored mapping in AsyncStorage.
 */
export async function cancelHabitReminder(habitId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.habitId === habitId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

/**
 * Schedule an end-of-day nudge if a habit hasn't been completed.
 * Triggered at 21:00 by default (adaptive nudge).
 */
export async function scheduleAdaptiveNudge(params: {
  habitId: string;
  habitName: string;
  nudgeHour?: number;
}): Promise<string> {
  const hour = params.nudgeHour ?? 21;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Don't break your streak! 🔥`,
      body: `You haven't completed "${params.habitName}" yet today.`,
      data: { habitId: params.habitId, type: 'nudge' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });

  return notificationId;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Android requires a notification channel
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('habits', {
    name: 'Habit Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6C63FF',
  });
}
