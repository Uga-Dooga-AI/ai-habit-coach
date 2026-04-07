import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthInit, useAuth } from '@/hooks/use-auth';
import { initObservability, recordNonFatal } from '@/lib/observability';
import { useHabitStore } from '@/stores/habit-store';
import { setupAndroidChannel } from '@/services/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

function OnboardingGuard() {
  const { isSignedIn, initialized, userId } = useAuth();
  const { loadProfile, profile } = useHabitStore();

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
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OnboardingGuard />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
