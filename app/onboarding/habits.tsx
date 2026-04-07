import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { HABIT_CATALOG } from '@/services/types';

type CatalogItem = typeof HABIT_CATALOG[number];

export default function OnboardingHabitsScreen() {
  const { goal } = useLocalSearchParams<{ goal: string }>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customHabit, setCustomHabit] = useState('');
  const [customHabits, setCustomHabits] = useState<string[]>([]);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addCustom = () => {
    const trimmed = customHabit.trim();
    if (!trimmed || customHabits.includes(trimmed)) return;
    setCustomHabits((prev) => [...prev, trimmed]);
    setSelected((prev) => new Set([...prev, trimmed]));
    setCustomHabit('');
  };

  const totalSelected = selected.size;

  const handleNext = () => {
    if (totalSelected === 0) return;

    const catalogSelected = HABIT_CATALOG.filter((h) => selected.has(h.name)).map((h) => ({
      name: h.name,
      category: h.category,
      icon: h.icon,
      isAiSuggested: true,
    }));

    const customSelected = customHabits
      .filter((name) => selected.has(name))
      .map((name) => ({
        name,
        category: 'general' as const,
        icon: '✨',
        isAiSuggested: false,
      }));

    const habits = JSON.stringify([...catalogSelected, ...customSelected]);
    router.push({ pathname: '/onboarding/reminder', params: { goal, habits } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 3</Text>
          <Text style={styles.title}>Pick your habits</Text>
          <Text style={styles.subtitle}>
            Choose habits to track daily. You can always add more later.
          </Text>
        </View>

        <View style={styles.grid}>
          {HABIT_CATALOG.map((item: CatalogItem) => {
            const isSelected = selected.has(item.name);
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.habitCard, isSelected && styles.habitCardSelected]}
                onPress={() => toggle(item.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.habitIcon}>{item.icon}</Text>
                <Text style={[styles.habitName, isSelected && styles.habitNameSelected]}>
                  {item.name}
                </Text>
                <Text style={styles.habitCategory}>{item.category}</Text>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {customHabits.length > 0 && (
          <View style={styles.customList}>
            {customHabits.map((name) => (
              <TouchableOpacity
                key={name}
                style={[styles.customTag, selected.has(name) && styles.customTagSelected]}
                onPress={() => toggle(name)}
              >
                <Text style={[styles.customTagText, selected.has(name) && styles.customTagTextSelected]}>
                  ✨ {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.customInput}>
          <Text style={styles.customLabel}>Add a custom habit</Text>
          <View style={styles.customRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Practice guitar"
              value={customHabit}
              onChangeText={setCustomHabit}
              onSubmitEditing={addCustom}
              returnKeyType="done"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={[styles.addButton, !customHabit.trim() && styles.addButtonDisabled]}
              onPress={addCustom}
              disabled={!customHabit.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {totalSelected === 0 ? 'Select at least 1 habit' : `${totalSelected} habit${totalSelected !== 1 ? 's' : ''} selected`}
        </Text>
        <TouchableOpacity
          style={[styles.nextButton, totalSelected === 0 && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={totalSelected === 0}
        >
          <Text style={styles.nextButtonText}>Set Reminder Time →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scroll: { padding: 24, paddingBottom: 120 },
  header: { marginBottom: 24 },
  step: { fontSize: 13, color: '#8B8FA8', fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1B2E', marginBottom: 12, lineHeight: 34 },
  subtitle: { fontSize: 16, color: '#6B6F8A', lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  habitCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E8EAF2',
    alignItems: 'flex-start',
    position: 'relative',
  },
  habitCardSelected: { borderColor: '#6C63FF', backgroundColor: '#F4F3FF' },
  habitIcon: { fontSize: 28, marginBottom: 8 },
  habitName: { fontSize: 13, fontWeight: '600', color: '#1A1B2E', lineHeight: 18 },
  habitNameSelected: { color: '#6C63FF' },
  habitCategory: { fontSize: 11, color: '#9CA3AF', marginTop: 3, textTransform: 'capitalize' },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  customList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  customTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E8EAF2',
    backgroundColor: '#fff',
  },
  customTagSelected: { borderColor: '#6C63FF', backgroundColor: '#F4F3FF' },
  customTagText: { fontSize: 13, color: '#6B6F8A', fontWeight: '600' },
  customTagTextSelected: { color: '#6C63FF' },
  customInput: { marginBottom: 16 },
  customLabel: { fontSize: 14, fontWeight: '600', color: '#1A1B2E', marginBottom: 10 },
  customRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E8EAF2',
    fontSize: 15,
    color: '#1A1B2E',
  },
  addButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonDisabled: { backgroundColor: '#C5C3E8' },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
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
  selectedCount: { fontSize: 13, color: '#8B8FA8', textAlign: 'center', fontWeight: '500' },
  nextButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  nextButtonDisabled: { backgroundColor: '#C5C3E8' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
