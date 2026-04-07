import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAnalytics } from './analytics-provider';
import { AnalyticsUserProperty } from './user-properties';
import { useHabitStore } from '@/stores/habit-store';
import { useSubscription } from '@/hooks/use-subscription';

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
  const profile = useHabitStore((s) => s.profile);

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
}
