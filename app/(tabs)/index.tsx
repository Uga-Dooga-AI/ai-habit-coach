import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Modal,
  Animated,
} from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { useHabitStore } from '@/stores/habit-store';
import { useAnalytics, AnalyticsEvents } from '@/services/analytics';
import type { HabitWithStreak } from '@/services/types';

function getDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

interface AIMessageModalProps {
  visible: boolean;
  message: string;
  habitName: string;
  onClose: () => void;
}

function AIMessageModal({ visible, message, habitName, onClose }: AIMessageModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalCard}>
          <Text style={styles.modalEmoji}>🎉</Text>
          <Text style={styles.modalHabit}>{habitName}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Keep Going!</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

interface HabitCardProps {
  habit: HabitWithStreak;
  onComplete: (habit: HabitWithStreak) => void;
  onSkip: (habit: HabitWithStreak) => void;
}

function HabitCard({ habit, onComplete, onSkip }: HabitCardProps) {
  const status = habit.todayLog?.status;
  const isDone = status === 'done';
  const isSkipped = status === 'skipped';
  const isPending = !status || status === 'pending';

  return (
    <View style={[styles.card, isDone && styles.cardDone, isSkipped && styles.cardSkipped]}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon}>{habit.icon}</Text>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, isDone && styles.cardNameDone]}>{habit.name}</Text>
          <View style={styles.cardMeta}>
            {habit.currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakBadgeText}>🔥 {habit.currentStreak}</Text>
              </View>
            )}
            <Text style={styles.cardCategory}>{habit.category}</Text>
          </View>
        </View>
      </View>

      {isPending && (
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.skipBtn} onPress={() => onSkip(habit)}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={() => onComplete(habit)}>
            <Text style={styles.doneBtnText}>Done ✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {isDone && (
        <View style={styles.doneIndicator}>
          <Text style={styles.doneIndicatorText}>✓</Text>
        </View>
      )}

      {isSkipped && (
        <View style={styles.skippedIndicator}>
          <Text style={styles.skippedIndicatorText}>–</Text>
        </View>
      )}
    </View>
  );
}

export default function TodayScreen() {
  const { state, isSignedIn, userId } = useAuth();
  const {
    loadHabits,
    loadTodayLogs,
    loadRecentLogs,
    loadProfile,
    completeHabit,
    skipHabit,
    habitsWithStreaks,
    completionRateToday,
    completionRateLast7Days,
    profile,
  } = useHabitStore();
  const analytics = useAnalytics();

  const [refreshing, setRefreshing] = useState(false);
  const [aiModal, setAiModal] = useState<{ visible: boolean; message: string; habitName: string }>({
    visible: false,
    message: '',
    habitName: '',
  });

  const profileId = profile?.id;

  const loadData = useCallback(async () => {
    if (!userId) return;
    await loadProfile(userId);
    const currentProfile = useHabitStore.getState().profile;
    if (!currentProfile) return;
    await Promise.all([
      loadHabits(currentProfile.id),
      loadTodayLogs(currentProfile.id),
      loadRecentLogs(currentProfile.id),
    ]);
  }, [userId, loadProfile, loadHabits, loadTodayLogs, loadRecentLogs]);

  useEffect(() => {
    if (isSignedIn) {
      loadData();
    }
  }, [isSignedIn, loadData]);

  // Fire today_view_opened once on mount when signed in
  useEffect(() => {
    if (!isSignedIn) return;
    const habits = habitsWithStreaks();
    const currentStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);
    const rate7d = completionRateLast7Days();
    const ev = AnalyticsEvents.Progress.dashboardViewed(habits.length, currentStreak, rate7d);
    analytics.logEvent(ev.name, ev.params);
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleComplete = async (habit: HabitWithStreak) => {
    if (!profileId) return;
    const message = await completeHabit(habit.id, profileId);

    const ev = AnalyticsEvents.Habits.habitCompleted(
      habit.id,
      habit.category,
      habit.currentStreak,
      getTimeOfDay(),
      0,
    );
    analytics.logEvent(ev.name, ev.params);

    const aiEv = AnalyticsEvents.AI.aiCoachingMessageShown('check_in_success', habit.category);
    analytics.logEvent(aiEv.name, aiEv.params);

    setAiModal({ visible: true, message, habitName: habit.name });
  };

  const handleSkip = async (habit: HabitWithStreak) => {
    if (!profileId) return;
    await skipHabit(habit.id, profileId);

    const ev = AnalyticsEvents.Habits.habitSkipped(habit.id, habit.category, 'user_skip', habit.currentStreak);
    analytics.logEvent(ev.name, ev.params);
  };

  const habits = habitsWithStreaks();
  const rate = completionRateToday();
  const doneCount = habits.filter((h) => h.todayLog?.status === 'done').length;
  const totalCount = habits.length;

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔑</Text>
          <Text style={styles.emptyTitle}>Sign in to track habits</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={habits}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.greeting}>{getDayGreeting()}</Text>
            <Text style={styles.date}>{getTodayLabel()}</Text>

            {totalCount > 0 && (
              <View style={styles.progressCard}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Today's Progress</Text>
                  <Text style={styles.progressCount}>{doneCount}/{totalCount}</Text>
                </View>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[styles.progressFill, { width: `${Math.round(rate * 100)}%` }]}
                  />
                </View>
                <Text style={styles.progressPercent}>
                  {rate === 1 ? '🎉 All done!' : `${Math.round(rate * 100)}% complete`}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              {totalCount === 0 ? 'Your Habits' : `${totalCount - doneCount} remaining`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <HabitCard habit={item} onComplete={handleComplete} onSkip={handleSkip} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtitle}>Complete onboarding to set up your first habits</Text>
          </View>
        }
      />

      <AIMessageModal
        visible={aiModal.visible}
        message={aiModal.message}
        habitName={aiModal.habitName}
        onClose={() => setAiModal((s) => ({ ...s, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  list: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 8 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1A1B2E', marginBottom: 2 },
  date: { fontSize: 14, color: '#8B8FA8', marginBottom: 20 },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8EAF2',
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#1A1B2E' },
  progressCount: { fontSize: 14, fontWeight: '700', color: '#6C63FF' },
  progressBar: { height: 8, backgroundColor: '#EEF0FB', borderRadius: 4, marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: '#6C63FF', borderRadius: 4 },
  progressPercent: { fontSize: 13, color: '#8B8FA8' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1B2E', marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E8EAF2',
  },
  cardDone: { borderColor: '#D1FAE5', backgroundColor: '#F0FDF4' },
  cardSkipped: { borderColor: '#F1F5F9', backgroundColor: '#F8FAFC', opacity: 0.7 },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { fontSize: 28, width: 40, textAlign: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#1A1B2E', marginBottom: 4 },
  cardNameDone: { color: '#059669', textDecorationLine: 'line-through' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
  },
  streakBadgeText: { fontSize: 11, fontWeight: '700', color: '#EA580C' },
  cardCategory: { fontSize: 11, color: '#9CA3AF', textTransform: 'capitalize' },
  cardActions: { flexDirection: 'row', gap: 8 },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8EAF2',
  },
  skipBtnText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#6C63FF',
  },
  doneBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  doneIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIndicatorText: { fontSize: 16, color: '#059669', fontWeight: '700' },
  skippedIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skippedIndicatorText: { fontSize: 20, color: '#9CA3AF', fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1B2E' },
  emptySubtitle: { fontSize: 14, color: '#8B8FA8', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    gap: 12,
  },
  modalEmoji: { fontSize: 48 },
  modalHabit: { fontSize: 18, fontWeight: '700', color: '#1A1B2E', textAlign: 'center' },
  modalMessage: { fontSize: 16, color: '#6B6F8A', textAlign: 'center', lineHeight: 24 },
  modalButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
