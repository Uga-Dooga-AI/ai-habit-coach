export const AnalyticsUserProperty = {
  SUBSCRIPTION_TIER: 'subscription_tier',
  HABIT_COUNT: 'habit_count',
  STREAK_CURRENT: 'streak_current',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  NUDGE_STYLE: 'nudge_style',
  TIMEZONE: 'timezone',
  DAYS_SINCE_INSTALL: 'days_since_install',
  PLATFORM: 'platform',
  // A/B experiment variant properties — set on every session so AppMetrica
  // can segment events and revenue metrics by active variant.
  ONBOARDING_VARIANT: 'onboarding_variant',
  PAYWALL_CTA_VARIANT: 'paywall_cta_variant',
  PAYWALL_PRICE_DISPLAY: 'paywall_price_display',
} as const;

export type AnalyticsUserPropertyKey = typeof AnalyticsUserProperty[keyof typeof AnalyticsUserProperty];
