import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { GOAL_OPTIONS } from '@/services/types';

export default function OnboardingGoalScreen() {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleNext = () => {
    if (!selectedGoal) return;
    router.push({ pathname: '/onboarding/habits', params: { goal: selectedGoal } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 1 of 3</Text>
          <Text style={styles.title}>What's your main goal?</Text>
          <Text style={styles.subtitle}>
            We'll personalize your habit suggestions based on what matters most to you.
          </Text>
        </View>

        <View style={styles.goals}>
          {GOAL_OPTIONS.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[styles.goalCard, selectedGoal === goal.id && styles.goalCardSelected]}
              onPress={() => setSelectedGoal(goal.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <View style={styles.goalText}>
                <Text style={[styles.goalLabel, selectedGoal === goal.id && styles.goalLabelSelected]}>
                  {goal.label}
                </Text>
                <Text style={styles.goalDescription}>{goal.description}</Text>
              </View>
              {selectedGoal === goal.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !selectedGoal && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedGoal}
        >
          <Text style={styles.nextButtonText}>Choose My Habits →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scroll: { padding: 24, paddingBottom: 100 },
  header: { marginBottom: 32 },
  step: { fontSize: 13, color: '#8B8FA8', fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1B2E', marginBottom: 12, lineHeight: 34 },
  subtitle: { fontSize: 16, color: '#6B6F8A', lineHeight: 24 },
  goals: { gap: 12 },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E8EAF2',
    gap: 14,
  },
  goalCardSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#F4F3FF',
  },
  goalIcon: { fontSize: 28 },
  goalText: { flex: 1 },
  goalLabel: { fontSize: 16, fontWeight: '600', color: '#1A1B2E', marginBottom: 2 },
  goalLabelSelected: { color: '#6C63FF' },
  goalDescription: { fontSize: 13, color: '#8B8FA8', lineHeight: 18 },
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
  },
  nextButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  nextButtonDisabled: { backgroundColor: '#C5C3E8' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
