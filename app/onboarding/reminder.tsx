import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useHabitStore } from '@/stores/habit-store';
import { useAuth } from '@/hooks/use-auth';
import { requestNotificationPermission } from '@/services/notifications';
import { useAnalytics, AnalyticsEvents } from '@/services/analytics';

const TIME_OPTIONS = [
  { label: 'Early Morning', time: '06:00', icon: '🌅' },
  { label: 'Morning', time: '08:00', icon: '☀️' },
  { label: 'Midday', time: '12:00', icon: '🌤' },
  { label: 'Afternoon', time: '15:00', icon: '⛅' },
  { label: 'Evening', time: '18:00', icon: '🌆' },
  { label: 'Night', time: '21:00', icon: '🌙' },
];

type HabitParam = {
  name: string;
  category: 'health' | 'mindfulness' | 'fitness' | 'learning' | 'productivity' | 'general';
  icon: string;
  isAiSuggested: boolean;
};

export default function OnboardingReminderScreen() {
  const { goal, habits: habitsJson } = useLocalSearchParams<{ goal: string; habits: string }>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { state } = useAuth();
  const { addHabit, completeOnboarding, loadProfile, profile } = useHabitStore();
  const analytics = useAnalytics();
  const onboardingStartRef = useRef<number>(Date.now());

  const userId = state.status === 'signed_in' ? state.userId : null;

  const handleFinish = async () => {
    if (!userId || !goal) return;
    setLoading(true);

    try {
      // Ensure profile exists
      let currentProfile = profile;
      if (!currentProfile) {
        await loadProfile(userId);
        currentProfile = useHabitStore.getState().profile;
      }

      if (!currentProfile) {
        Alert.alert('Error', 'Failed to load profile. Please try again.');
        setLoading(false);
        return;
      }

      // Request notification permission if a time was selected
      let notifGranted = false;
      if (selectedTime) {
        notifGranted = await requestNotificationPermission();
        const notifEv = AnalyticsEvents.Onboarding.onboardingNotificationPermission(notifGranted);
        analytics.logEvent(notifEv.name, notifEv.params);
      }

      // Parse habits from params
      const habitsToCreate: HabitParam[] = JSON.parse(habitsJson ?? '[]');

      // Create all habits
      for (const habit of habitsToCreate) {
        await addHabit({
          userId: currentProfile.id,
          name: habit.name,
          category: habit.category,
          icon: habit.icon,
          frequency: 'daily',
          reminderTime: selectedTime ?? undefined,
          isAiSuggested: habit.isAiSuggested,
        });
      }

      // Fire reminder_set if a time was chosen and notification was granted
      if (selectedTime && notifGranted) {
        const reminderEv = AnalyticsEvents.Nudges.reminderSet('onboarding', selectedTime, false);
        analytics.logEvent(reminderEv.name, reminderEv.params);
      }

      const stepEv = AnalyticsEvents.Onboarding.onboardingStepCompleted('reminder_setup', 2, 3);
      analytics.logEvent(stepEv.name, stepEv.params);

      // Mark onboarding as done
      await completeOnboarding(currentProfile.id, goal);

      const durationSec = Math.round((Date.now() - onboardingStartRef.current) / 1000);
      const completedEv = AnalyticsEvents.Onboarding.onboardingCompleted(durationSec, habitsToCreate.length);
      analytics.logEvent(completedEv.name, completedEv.params);

      router.replace('/(tabs)');
    } catch (e) {
      console.error('Onboarding finish error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 3 of 3</Text>
          <Text style={styles.title}>Set a reminder time</Text>
          <Text style={styles.subtitle}>
            When should we remind you to complete your habits? You can skip this and set per-habit reminders later.
          </Text>
        </View>

        <View style={styles.times}>
          {TIME_OPTIONS.map((option) => {
            const isSelected = selectedTime === option.time;
            return (
              <TouchableOpacity
                key={option.time}
                style={[styles.timeCard, isSelected && styles.timeCardSelected]}
                onPress={() => setSelectedTime(isSelected ? null : option.time)}
                activeOpacity={0.7}
              >
                <Text style={styles.timeIcon}>{option.icon}</Text>
                <View style={styles.timeText}>
                  <Text style={[styles.timeLabel, isSelected && styles.timeLabelSelected]}>
                    {option.label}
                  </Text>
                  <Text style={styles.timeValue}>{option.time}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.finishButton, loading && styles.buttonLoading]}
          onPress={handleFinish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.finishButtonText}>Start My Journey 🎉</Text>
          )}
        </TouchableOpacity>
        {!selectedTime && (
          <TouchableOpacity style={styles.skipButton} onPress={handleFinish} disabled={loading}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scroll: { padding: 24, paddingBottom: 140 },
  header: { marginBottom: 32 },
  step: { fontSize: 13, color: '#8B8FA8', fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1B2E', marginBottom: 12, lineHeight: 34 },
  subtitle: { fontSize: 16, color: '#6B6F8A', lineHeight: 24 },
  times: { gap: 12 },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E8EAF2',
    gap: 14,
  },
  timeCardSelected: { borderColor: '#6C63FF', backgroundColor: '#F4F3FF' },
  timeIcon: { fontSize: 26, width: 36, textAlign: 'center' },
  timeText: { flex: 1 },
  timeLabel: { fontSize: 16, fontWeight: '600', color: '#1A1B2E' },
  timeLabelSelected: { color: '#6C63FF' },
  timeValue: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#F8F9FF',
    borderTopWidth: 1,
    borderTopColor: '#E8EAF2',
    gap: 10,
  },
  finishButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  buttonLoading: { opacity: 0.7 },
  finishButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipButton: { alignItems: 'center', padding: 8 },
  skipText: { color: '#8B8FA8', fontSize: 14 },
});
