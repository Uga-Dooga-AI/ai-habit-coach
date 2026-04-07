import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useHabitStore } from '@/stores/habit-store';
import { useAnalytics, AnalyticsEvents } from '@/services/analytics';
import type { HabitCategory, HabitFrequency } from '@/services/types';

const CATEGORIES: HabitCategory[] = ['health', 'mindfulness', 'fitness', 'learning', 'productivity', 'general'];
const FREQUENCIES: HabitFrequency[] = ['daily', 'weekdays', 'weekends'];

const CATEGORY_ICONS: Record<HabitCategory, string> = {
  health: '❤️',
  mindfulness: '🧘',
  fitness: '💪',
  learning: '📚',
  productivity: '⚡',
  general: '✨',
};

export default function EditHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, editHabit, archiveHabit, deleteHabit } = useHabitStore();
  const analytics = useAnalytics();

  const habit = habits.find((h) => h.id === id);

  const [name, setName] = useState(habit?.name ?? '');
  const [category, setCategory] = useState<HabitCategory>(habit?.category ?? 'general');
  const [icon, setIcon] = useState(habit?.icon ?? '✨');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency ?? 'daily');
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(habit?.notificationsEnabled ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!habit) {
      Alert.alert('Not Found', 'Habit not found.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [habit, router]);

  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Habit name is required.');
      return;
    }

    const changedFields: string[] = [];
    if (name.trim() !== habit.name) changedFields.push('name');
    if (category !== habit.category) changedFields.push('category');
    if (icon.trim() !== habit.icon) changedFields.push('icon');
    if (description.trim() !== (habit.description ?? '')) changedFields.push('description');
    if (frequency !== habit.frequency) changedFields.push('frequency');
    if (reminderTime !== (habit.reminderTime ?? '')) changedFields.push('reminder_time');
    if (notificationsEnabled !== habit.notificationsEnabled) changedFields.push('notifications_enabled');

    setSaving(true);
    try {
      await editHabit(habit.id, {
        name: name.trim(),
        category,
        icon: icon.trim() || '✨',
        description: description.trim() || undefined,
        frequency,
        reminderTime: reminderTime.trim() || null,
        notificationsEnabled,
      });
      if (changedFields.length > 0) {
        const ev = AnalyticsEvents.Habits.habitEdited(habit.id, changedFields.join(','));
        analytics.logEvent(ev.name, ev.params);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = () => {
    Alert.alert('Archive Habit', 'This habit will be hidden from your daily list. You can restore it later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveHabit(habit.id);
            const ev = AnalyticsEvents.Habits.habitArchived(habit.id, habit.category, 0, 0);
            analytics.logEvent(ev.name, ev.params);
            router.back();
          } catch {
            Alert.alert('Error', 'Could not archive habit. Please try again.');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Habit', 'This will permanently delete the habit and all its history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHabit(habit.id);
            const ev = AnalyticsEvents.Habits.habitDeleted(habit.id, habit.category, 0, 0);
            analytics.logEvent(ev.name, ev.params);
            router.back();
          } catch {
            Alert.alert('Error', 'Could not delete habit. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Edit Habit</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#6C63FF" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Habit Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning Meditation"
            placeholderTextColor="#9CA3AF"
            returnKeyType="done"
          />
        </View>

        {/* Icon */}
        <View style={styles.field}>
          <Text style={styles.label}>Icon (emoji)</Text>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={icon}
            onChangeText={setIcon}
            placeholder="✨"
            placeholderTextColor="#9CA3AF"
            maxLength={4}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipSelected]}
                onPress={() => setCategory(cat)}
              >
                <Text style={styles.chipIcon}>{CATEGORY_ICONS[cat]}</Text>
                <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.field}>
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.segmentRow}>
            {FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[styles.segment, frequency === freq && styles.segmentSelected]}
                onPress={() => setFrequency(freq)}
              >
                <Text style={[styles.segmentText, frequency === freq && styles.segmentTextSelected]}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholder="What does this habit involve?"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Reminder */}
        <View style={styles.field}>
          <Text style={styles.label}>Reminder Time (HH:MM)</Text>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="e.g. 07:30"
            placeholderTextColor="#9CA3AF"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          <Text style={styles.hint}>Leave empty to remove reminder</Text>
        </View>

        {/* Notifications toggle */}
        <View style={styles.field}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.label}>Notifications Enabled</Text>
              <Text style={styles.hint}>Receive reminders for this habit</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, notificationsEnabled && styles.toggleOn]}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              <View style={[styles.toggleThumb, notificationsEnabled && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.archiveBtn} onPress={handleArchive}>
            <Text style={styles.archiveBtnText}>Archive Habit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete Habit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scroll: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  cancelText: { fontSize: 16, color: '#8B8FA8', fontWeight: '500' },
  screenTitle: { fontSize: 17, fontWeight: '700', color: '#1A1B2E' },
  saveText: { fontSize: 16, color: '#6C63FF', fontWeight: '700' },
  field: { marginBottom: 22 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1B2E', marginBottom: 8 },
  hint: { fontSize: 12, color: '#8B8FA8', marginTop: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E8EAF2',
    fontSize: 15,
    color: '#1A1B2E',
  },
  inputSmall: { width: 120 },
  inputMulti: { height: 90, paddingTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8EAF2',
    backgroundColor: '#fff',
  },
  chipSelected: { borderColor: '#6C63FF', backgroundColor: '#F4F3FF' },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 13, color: '#6B6F8A', fontWeight: '600', textTransform: 'capitalize' },
  chipTextSelected: { color: '#6C63FF' },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF0FB',
    borderRadius: 12,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentSelected: { backgroundColor: '#fff' },
  segmentText: { fontSize: 13, color: '#8B8FA8', fontWeight: '600' },
  segmentTextSelected: { color: '#6C63FF', fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8EAF2',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: '#6C63FF' },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  dangerZone: { marginTop: 12, gap: 10, paddingBottom: 20 },
  archiveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  archiveBtnText: { fontSize: 15, fontWeight: '600', color: '#B45309' },
  deleteBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: '#DC2626' },
});
