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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/use-auth';
import { useHabitStore } from '@/stores/habit-store';
import { useSubscription } from '@/hooks/use-subscription';
import { useAnalytics, AnalyticsEvents } from '@/services/analytics';
import { PaywallModal } from '@/components/paywall-modal';
import { HabitListSkeleton } from '@/components/loading-skeleton';
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
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1} accessibilityLabel="Close dialog">
        <View style={styles.modalCard} accessibilityRole="alert" accessibilityLabel={`${habitName}: ${message}`}>
          <Text style={styles.modalEmoji} accessibilityElementsHidden>🎉</Text>
          <Text style={styles.modalHabit}>{habitName}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Keep going, dismiss">
            <Text style={styles.modalButtonText}>Keep Going!</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

interface HabitMenuModalProps {
  visible: boolean;
  habitName: string;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function HabitMenuModal({ visible, habitName, onEdit, onArchive, onDelete, onClose }: HabitMenuModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1} accessibilityLabel="Close menu">
        <View style={styles.menuCard} accessibilityRole="menu" accessibilityLabel={`Options for ${habitName}`}>
          <Text style={styles.menuTitle}>{habitName}</Text>
          <TouchableOpacity style={styles.menuItem} onPress={onEdit} accessibilityRole="menuitem" accessibilityLabel="Edit habit">
            <Text style={styles.menuItemText}>✏️  Edit</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={onArchive} accessibilityRole="menuitem" accessibilityLabel="Archive habit">
            <Text style={styles.menuItemText}>📦  Archive</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={onDelete} accessibilityRole="menuitem" accessibilityLabel="Delete habit">
            <Text style={[styles.menuItemText, styles.menuItemDestructive]}>🗑️  Delete</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={onClose} accessibilityRole="menuitem" accessibilityLabel="Cancel">
            <Text style={[styles.menuItemText, styles.menuItemCancel]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

interface HabitCardProps {
  habit: HabitWithStreak;
  index: number;
  isLocked: boolean;
  onComplete: (habit: HabitWithStreak) => void;
  onSkip: (habit: HabitWithStreak) => void;
  onMenu: (habit: HabitWithStreak) => void;
  onLockedTap: () => void;
}

function HabitCard({ habit, index, isLocked, onComplete, onSkip, onMenu, onLockedTap }: HabitCardProps) {
  const status = habit.todayLog?.status;
  const isDone = status === 'done';
  const isSkipped = status === 'skipped';
  const isPending = !status || status === 'pending';

  const statusLabel = isDone ? 'completed' : isSkipped ? 'skipped' : 'pending';
  const streakLabel = habit.currentStreak > 0 ? `, ${habit.currentStreak} day streak` : '';

  if (isLocked) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.cardLocked]}
        onPress={onLockedTap}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, locked. Tap to unlock with Premium`}
      >
        <View style={styles.cardLeft}>
          <Text style={[styles.cardIcon, { opacity: 0.4 }]} accessibilityElementsHidden>{habit.icon}</Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { opacity: 0.4 }]}>{habit.name}</Text>
            <Text style={styles.cardCategory}>{habit.category}</Text>
          </View>
        </View>
        <View style={styles.lockBadge}>
          <Text style={styles.lockBadgeText}>🔒</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[styles.card, isDone && styles.cardDone, isSkipped && styles.cardSkipped]}
      accessibilityLabel={`${habit.name}, ${habit.category}, ${statusLabel}${streakLabel}`}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon} accessibilityElementsHidden>{habit.icon}</Text>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, isDone && styles.cardNameDone]}>{habit.name}</Text>
          <View style={styles.cardMeta}>
            {habit.currentStreak > 0 && (
              <View style={styles.streakBadge} accessibilityLabel={`${habit.currentStreak} day streak`}>
                <Text style={styles.streakBadgeText}>🔥 {habit.currentStreak}</Text>
              </View>
            )}
            <Text style={styles.cardCategory}>{habit.category}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRight}>
        {isPending && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => onSkip(habit)}
              accessibilityRole="button"
              accessibilityLabel={`Skip ${habit.name}`}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => onComplete(habit)}
              accessibilityRole="button"
              accessibilityLabel={`Complete ${habit.name}`}
            >
              <Text style={styles.doneBtnText}>Done ✓</Text>
            </TouchableOpacity>
          </View>
        )}

        {isDone && (
          <View style={styles.doneIndicator} accessibilityLabel="Completed">
            <Text style={styles.doneIndicatorText}>✓</Text>
          </View>
        )}

        {isSkipped && (
          <View style={styles.skippedIndicator} accessibilityLabel="Skipped">
            <Text style={styles.skippedIndicatorText}>–</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => onMenu(habit)}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${habit.name}`}
        >
          <Text style={styles.menuBtnText}>⋯</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TodayScreen() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  const {
    loadHabits,
    loadTodayLogs,
    loadRecentLogs,
    loadProfile,
    loadSubscription,
    completeHabit,
    skipHabit,
    archiveHabit,
    deleteHabit,
    habitsWithStreaks,
    completionRateToday,
    completionRateLast7Days,
    profile,
  } = useHabitStore();
  const { isPremium, canAddHabit } = useSubscription();
  const analytics = useAnalytics();

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiModal, setAiModal] = useState<{ visible: boolean; message: string; habitName: string }>({
    visible: false,
    message: '',
    habitName: '',
  });
  const [menuModal, setMenuModal] = useState<{ visible: boolean; habit: HabitWithStreak | null }>({
    visible: false,
    habit: null,
  });
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string | undefined>(undefined);

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
      loadSubscription(),
    ]);
  }, [userId, loadProfile, loadHabits, loadTodayLogs, loadRecentLogs, loadSubscription]);

  useEffect(() => {
    if (isSignedIn) {
      loadData().finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
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

    // Haptic: heavy impact for streak milestones (7, 14, 21, 30…), medium otherwise
    const nextStreak = habit.currentStreak + 1;
    if (nextStreak > 0 && nextStreak % 7 === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const message = await completeHabit(habit.id, profileId);

    const ev = AnalyticsEvents.Habits.habitCompleted(
      habit.id,
      habit.category,
      habit.currentStreak,
      getTimeOfDay(),
      0,
    );
    analytics.logEvent(ev.name, ev.params);

    // Streak events
    const streakEv = AnalyticsEvents.Streaks.streakIncremented(nextStreak, 1);
    analytics.logEvent(streakEv.name, streakEv.params);

    if (nextStreak > 0 && nextStreak % 7 === 0) {
      const milestoneType = nextStreak >= 30 ? '30_day' : nextStreak >= 21 ? '21_day' : nextStreak >= 14 ? '14_day' : '7_day';
      const milestoneEv = AnalyticsEvents.Streaks.streakMilestone(nextStreak, milestoneType);
      analytics.logEvent(milestoneEv.name, milestoneEv.params);
    }

    const aiEv = AnalyticsEvents.AI.aiCoachingMessageShown('check_in_success', habit.category);
    analytics.logEvent(aiEv.name, aiEv.params);

    setAiModal({ visible: true, message, habitName: habit.name });
  };

  const handleSkip = async (habit: HabitWithStreak) => {
    if (!profileId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipHabit(habit.id, profileId);

    const ev = AnalyticsEvents.Habits.habitSkipped(habit.id, habit.category, 'user_skip', habit.currentStreak);
    analytics.logEvent(ev.name, ev.params);
  };

  const handleAddHabit = () => {
    const habits = habitsWithStreaks();
    if (!canAddHabit(habits.length)) {
      const limitEv = AnalyticsEvents.Habits.habitLimitHit();
      analytics.logEvent(limitEv.name, limitEv.params);
      const shownEv = AnalyticsEvents.Paywall.paywallShown('add_habit_limit', 'add_habit_limit');
      analytics.logEvent(shownEv.name, shownEv.params);
      setPaywallReason("You've reached the 3-habit limit on the free plan. Upgrade to add unlimited habits.");
      setPaywallVisible(true);
      return;
    }
    router.push('/onboarding/habits');
  };

  const handleLockedTap = () => {
    const shownEv = AnalyticsEvents.Paywall.paywallShown('locked_habit', 'ai_insights_gate');
    analytics.logEvent(shownEv.name, shownEv.params);
    setPaywallReason("This habit is locked. Upgrade to Premium to unlock unlimited habits.");
    setPaywallVisible(true);
  };

  const handlePaywallClose = () => {
    const dismissEv = AnalyticsEvents.Paywall.paywallDismissed('inline_modal', 0);
    analytics.logEvent(dismissEv.name, dismissEv.params);
    setPaywallVisible(false);
  };

  const openMenu = (habit: HabitWithStreak) => {
    setMenuModal({ visible: true, habit });
  };

  const closeMenu = () => {
    setMenuModal({ visible: false, habit: null });
  };

  const handleMenuEdit = () => {
    const habit = menuModal.habit;
    closeMenu();
    if (habit) {
      router.push(`/edit-habit/${habit.id}`);
    }
  };

  const handleMenuArchive = async () => {
    const habit = menuModal.habit;
    closeMenu();
    if (!habit) return;
    try {
      await archiveHabit(habit.id);
      const ev = AnalyticsEvents.Habits.habitArchived(habit.id, habit.category, 0, 0);
      analytics.logEvent(ev.name, ev.params);
    } catch {
      Alert.alert('Error', 'Could not archive habit. Please try again.');
    }
  };

  const handleMenuDelete = () => {
    const habit = menuModal.habit;
    closeMenu();
    if (!habit) return;

    Alert.alert(
      'Delete Habit',
      `Are you sure you want to permanently delete "${habit.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habit.id);
              const ev = AnalyticsEvents.Habits.habitDeleted(habit.id, habit.category, 0, 0);
              analytics.logEvent(ev.name, ev.params);
            } catch {
              Alert.alert('Error', 'Could not delete habit. Please try again.');
            }
          },
        },
      ],
    );
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
                  <Text style={styles.progressLabel}>Today&apos;s Progress</Text>
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

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>
                {totalCount === 0 ? 'Your Habits' : `${totalCount - doneCount} remaining`}
              </Text>
              <TouchableOpacity
                style={styles.addHabitBtn}
                onPress={handleAddHabit}
                accessibilityRole="button"
                accessibilityLabel="Add new habit"
              >
                <Text style={styles.addHabitBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const isLocked = !isPremium && index >= 3;
          return (
            <HabitCard
              habit={item}
              index={index}
              isLocked={isLocked}
              onComplete={handleComplete}
              onSkip={handleSkip}
              onMenu={openMenu}
              onLockedTap={handleLockedTap}
            />
          );
        }}
        ListEmptyComponent={
          initialLoading ? (
            <HabitListSkeleton count={3} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>No habits yet</Text>
              <Text style={styles.emptySubtitle}>Complete onboarding to set up your first habits</Text>
            </View>
          )
        }
      />

      <AIMessageModal
        visible={aiModal.visible}
        message={aiModal.message}
        habitName={aiModal.habitName}
        onClose={() => setAiModal((s) => ({ ...s, visible: false }))}
      />

      <HabitMenuModal
        visible={menuModal.visible}
        habitName={menuModal.habit?.name ?? ''}
        onEdit={handleMenuEdit}
        onArchive={handleMenuArchive}
        onDelete={handleMenuDelete}
        onClose={closeMenu}
      />

      <PaywallModal
        visible={paywallVisible}
        onClose={handlePaywallClose}
        reason={paywallReason}
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
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1B2E' },
  addHabitBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addHabitBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
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
  cardLocked: { borderColor: '#E8EAF2', backgroundColor: '#FAFBFF', opacity: 0.8 },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F4F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  menuBtnText: { fontSize: 16, color: '#6C63FF', fontWeight: '700' },
  lockBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadgeText: { fontSize: 16 },
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
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    width: '100%',
    maxWidth: 320,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B8FA8',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItem: { paddingVertical: 14, paddingHorizontal: 20 },
  menuItemText: { fontSize: 16, color: '#1A1B2E', fontWeight: '500' },
  menuItemDestructive: { color: '#EF4444' },
  menuItemCancel: { color: '#8B8FA8', textAlign: 'center' },
  menuDivider: { height: 1, backgroundColor: '#F1F3FB', marginHorizontal: 8 },
});
