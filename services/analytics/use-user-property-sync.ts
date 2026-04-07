import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnalytics } from './analytics-provider';
import { AnalyticsUserProperty } from './user-properties';
import { useHabitStore } from '@/stores/habit-store';
import { useSubscription } from '@/hooks/use-subscription';

const INSTALL_DATE_KEY = 'analytics_install_date';

async function getOrSetInstallDate(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(INSTALL_DATE_KEY);
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    await AsyncStorage.setItem(INSTALL_DATE_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

/**
 * Syncs key user properties to all analytics trackers on every meaningful
 * state change so that every subsequent event can be segmented by these
 * dimensions without extra per-event work.
 *
 * Mount once in the root layout — it reads from Zustand and subscription
 * hooks reactively.
 */
export function useUserPropertySync(): void {
  const tracker = useAnalytics();
  const { tier } = useSubscription();
  const habits = useHabitStore((s) => s.habits);
  const recentLogs = useHabitStore((s) => s.recentLogs);
  const profile = useHabitStore((s) => s.profile);
  const habitsWithStreaks = useHabitStore((s) => s.habitsWithStreaks);

  // Subscription tier
  useEffect(() => {
    tracker.setUserProperty(AnalyticsUserProperty.SUBSCRIPTION_TIER, tier);
  }, [tier, tracker]);

  // Habit count
  useEffect(() => {
    tracker.setUserProperty(
      AnalyticsUserProperty.HABIT_COUNT,
      String(habits.length),
    );
  }, [habits.length, tracker]);

  // Onboarding completion
  useEffect(() => {
    if (!profile) return;
    tracker.setUserProperty(
      AnalyticsUserProperty.ONBOARDING_COMPLETE,
      profile.onboardingCompleted ? 'true' : 'false',
    );
  }, [profile?.onboardingCompleted, tracker]);

  // Platform (static, set once)
  useEffect(() => {
    tracker.setUserProperty(AnalyticsUserProperty.PLATFORM, Platform.OS);
  }, [tracker]);

  // Timezone (static per session)
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    tracker.setUserProperty(AnalyticsUserProperty.TIMEZONE, tz);
  }, [tracker]);

  // Current max streak across all active habits
  useEffect(() => {
    if (habits.length === 0) return;
    const withStreaks = habitsWithStreaks();
    const maxStreak = withStreaks.reduce(
      (max, h) => Math.max(max, h.currentStreak),
      0,
    );
    tracker.setUserProperty(
      AnalyticsUserProperty.STREAK_CURRENT,
      String(maxStreak),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, recentLogs, tracker]);

  // Days since first install (persisted across app updates)
  useEffect(() => {
    getOrSetInstallDate().then((installTs) => {
      const days = Math.floor((Date.now() - installTs) / 86_400_000);
      tracker.setUserProperty(
        AnalyticsUserProperty.DAYS_SINCE_INSTALL,
        String(days),
      );
    });
  }, [tracker]);
}
