export const AnalyticsUserProperty = {
  SUBSCRIPTION_TIER: 'subscription_tier',
  HABIT_COUNT: 'habit_count',
  STREAK_CURRENT: 'streak_current',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  NUDGE_STYLE: 'nudge_style',
  TIMEZONE: 'timezone',
  DAYS_SINCE_INSTALL: 'days_since_install',
  PLATFORM: 'platform',
} as const;

export type AnalyticsUserPropertyKey = typeof AnalyticsUserProperty[keyof typeof AnalyticsUserProperty];
