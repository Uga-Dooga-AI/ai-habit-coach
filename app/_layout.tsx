import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthInit, useAuth } from '@/hooks/use-auth';
import { initObservability, recordNonFatal, setExperimentContext } from '@/lib/observability';
import { ErrorBoundary } from '@/components/error-boundary';
import { useHabitStore } from '@/stores/habit-store';
import { setupAndroidChannel } from '@/services/notifications';
import {
  AnalyticsProvider,
  AnalyticsUserProperty,
  CompositeTracker,
  FirebaseAnalyticsTracker,
  AppMetricaTracker,
  StubRemoteConfigProvider,
  AnalyticsEvents,
  useScreenTracking,
} from '@/services/analytics';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Deferred mode: StubRemoteConfigProvider holds defaults until Firebase credentials arrive.
// Switch to FirebaseRemoteConfigProvider once google-services.json / GoogleService-Info.plist
// are present and @react-native-firebase packages are linked.
const remoteConfig = new StubRemoteConfigProvider({
  habit_catalog_items: 'default',
  ai_model_haiku: 'claude-haiku-4-5-20251001',
  ai_model_sonnet: 'claude-sonnet-4-6',
  reminders_enabled: 'true',
  weekly_insights_enabled: 'true',
  onboarding_variant: 'control',
  // Sprint 2 A/B experiments.
  // paywall_cta_variant: 'a' = "Начать 7 дней бесплатно" (control), 'b' = "Попробовать Premium"
  paywall_cta_variant: 'a',
  // paywall_price_display: 'monthly_first' (control) | 'annual_first'
  paywall_price_display: 'monthly_first',
  active_experiment_ids: '',
});

const tracker = new CompositeTracker([
  new FirebaseAnalyticsTracker(),
  new AppMetricaTracker(remoteConfig),
]);

function ScreenTracker() {
  useScreenTracking();
  return null;
}

function OnboardingGuard() {
  const { isSignedIn, initialized, userId } = useAuth();
  const { loadProfile } = useHabitStore();

  useEffect(() => {
    if (!initialized || !isSignedIn || !userId) return;

    loadProfile(userId).then(() => {
      const currentProfile = useHabitStore.getState().profile;
      if (currentProfile && !currentProfile.onboardingCompleted) {
        router.replace('/onboarding');
      }
    });
  }, [initialized, isSignedIn, userId, loadProfile]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useAuthInit();

  useEffect(() => {
    initObservability().catch((err) =>
      recordNonFatal('observability_init', err),
    );
    setupAndroidChannel().catch(() => {});

    // Bootstrap Remote Config. In deferred (stub) mode this resolves immediately.
    // When Firebase credentials are live, swap to FirebaseRemoteConfigProvider above
    // and this will fetch real experiment assignments.
    remoteConfig.fetchAndActivate().then(() => {
      const onboardingVariant = remoteConfig.variantValue('onboarding_variant');
      if (onboardingVariant && onboardingVariant !== 'control') {
        const ev = AnalyticsEvents.Experiment.experimentExposure('onboarding_variant', onboardingVariant);
        tracker.logEvent(ev.name, ev.params);
        setExperimentContext({ experimentName: 'onboarding_variant', variantName: onboardingVariant }).catch(() => {});
      }

      // Sprint 2 A/B experiments — push variants to AppMetrica as user properties
      // so all events can be segmented by active variant regardless of paywall exposure.
      const paywallCtaVariant = remoteConfig.variantValue('paywall_cta_variant');
      if (paywallCtaVariant) {
        tracker.setUserProperty(AnalyticsUserProperty.PAYWALL_CTA_VARIANT, paywallCtaVariant);
        if (paywallCtaVariant !== 'a') {
          const ev = AnalyticsEvents.Experiment.experimentExposure('paywall_cta_variant', paywallCtaVariant);
          tracker.logEvent(ev.name, ev.params);
        }
      }

      const paywallPriceDisplay = remoteConfig.variantValue('paywall_price_display');
      if (paywallPriceDisplay) {
        tracker.setUserProperty(AnalyticsUserProperty.PAYWALL_PRICE_DISPLAY, paywallPriceDisplay);
        if (paywallPriceDisplay !== 'monthly_first') {
          const ev = AnalyticsEvents.Experiment.experimentExposure('paywall_price_display', paywallPriceDisplay);
          tracker.logEvent(ev.name, ev.params);
        }
      }
    }).catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <AnalyticsProvider tracker={tracker}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ScreenTracker />
          <OnboardingGuard />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="edit-habit/[id]" options={{ presentation: 'modal', title: 'Edit Habit' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
}
