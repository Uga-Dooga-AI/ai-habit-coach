import { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { useHabitStore } from '@/stores/habit-store';
import { calculateStreak } from '@/services/habits';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** 7x6 grid of the last 42 days, colored by completion */
function HeatmapCalendar() {
  const { habits, recentLogs } = useHabitStore();

  // Build last 42 days
  const days: { date: string; rate: number }[] = [];
  for (let i = 41; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = recentLogs.filter((l) => l.logDate === dateStr);
    const done = dayLogs.filter((l) => l.status === 'done').length;
    const total = habits.length;
    days.push({ date: dateStr, rate: total > 0 ? done / total : 0 });
  }

  function cellColor(rate: number): string {
    if (rate === 0) return '#EEF0FB';
    if (rate < 0.34) return '#C4BFFA';
    if (rate < 0.67) return '#8B7FF5';
    return '#6C63FF';
  }

  return (
    <View style={heatStyles.container}>
      <Text style={heatStyles.title}>Activity (Last 6 Weeks)</Text>
      <View style={heatStyles.grid}>
        {days.map((day, i) => (
          <View
            key={day.date}
            style={[heatStyles.cell, { backgroundColor: cellColor(day.rate) }]}
          />
        ))}
      </View>
      <View style={heatStyles.legend}>
        <Text style={heatStyles.legendLabel}>Less</Text>
        {[0, 0.25, 0.6, 1].map((r) => (
          <View key={r} style={[heatStyles.legendCell, { backgroundColor: cellColor(r) }]} />
        ))}
        <Text style={heatStyles.legendLabel}>More</Text>
      </View>
    </View>
  );
}

const heatStyles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E8EAF2' },
  title: { fontSize: 14, fontWeight: '600', color: '#1A1B2E', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 14, height: 14, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  legendLabel: { fontSize: 11, color: '#9CA3AF' },
  legendCell: { width: 12, height: 12, borderRadius: 2 },
});

interface StreakCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

function StatCard({ label, value, icon, color }: StreakCardProps) {
  return (
    <View style={[statStyles.card, { borderColor: color + '40' }]}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 4,
  },
  icon: { fontSize: 24 },
  value: { fontSize: 28, fontWeight: '700' },
  label: { fontSize: 12, color: '#8B8FA8', textAlign: 'center' },
});

export default function ProgressScreen() {
  const { isSignedIn, userId } = useAuth();
  const {
    loadHabits,
    loadRecentLogs,
    loadProfile,
    profile,
    habits,
    recentLogs,
    habitsWithStreaks,
    completionRateLast7Days,
  } = useHabitStore();

  const loadData = useCallback(async () => {
    if (!userId) return;
    await loadProfile(userId);
    const currentProfile = useHabitStore.getState().profile;
    if (!currentProfile) return;
    await Promise.all([
      loadHabits(currentProfile.id),
      loadRecentLogs(currentProfile.id),
    ]);
  }, [userId, loadProfile, loadHabits, loadRecentLogs]);

  useEffect(() => {
    if (isSignedIn) loadData();
  }, [isSignedIn, loadData]);

  const habitsWS = habitsWithStreaks();
  const rate7d = completionRateLast7Days();

  // Overall best streak across all habits
  const overallBest = habitsWS.reduce((max, h) => Math.max(max, h.bestStreak), 0);
  const overallCurrent = habitsWS.reduce((max, h) => Math.max(max, h.currentStreak), 0);
  const totalCompleted = recentLogs.filter((l) => l.status === 'done').length;

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>Sign in to see your progress</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={loadData} tintColor="#6C63FF" />}
      >
        <Text style={styles.title}>Progress</Text>

        <View style={styles.statsRow}>
          <StatCard label="Current Streak" value={overallCurrent} icon="🔥" color="#EA580C" />
          <StatCard label="Best Streak" value={overallBest} icon="🏆" color="#D97706" />
          <StatCard label="Total Done" value={totalCompleted} icon="✅" color="#059669" />
        </View>

        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>7-Day Completion Rate</Text>
          <Text style={styles.rateValue}>{Math.round(rate7d * 100)}%</Text>
          <View style={styles.rateBar}>
            <View style={[styles.rateFill, { width: `${Math.round(rate7d * 100)}%` }]} />
          </View>
        </View>

        <HeatmapCalendar />

        {habitsWS.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Per-Habit Streaks</Text>
            {habitsWS.map((h) => (
              <View key={h.id} style={styles.habitRow}>
                <Text style={styles.habitIcon}>{h.icon}</Text>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{h.name}</Text>
                  <View style={styles.habitStreak}>
                    <Text style={styles.habitStreakText}>
                      🔥 {h.currentStreak} day streak
                    </Text>
                    <Text style={styles.habitBestText}>Best: {h.bestStreak}</Text>
                  </View>
                </View>
                <View style={styles.habitRate}>
                  <Text style={styles.habitRateText}>
                    {Math.round(
                      (recentLogs.filter((l) => l.habitId === h.id && l.status === 'done').length /
                        Math.max(1, 7)) * 100,
                    )}%
                  </Text>
                  <Text style={styles.habitRateLabel}>7-day</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scroll: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1B2E', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  rateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EAF2',
  },
  rateLabel: { fontSize: 14, fontWeight: '600', color: '#1A1B2E', marginBottom: 8 },
  rateValue: { fontSize: 32, fontWeight: '700', color: '#6C63FF', marginBottom: 10 },
  rateBar: { height: 8, backgroundColor: '#EEF0FB', borderRadius: 4 },
  rateFill: { height: 8, backgroundColor: '#6C63FF', borderRadius: 4 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E8EAF2' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1B2E', marginBottom: 14 },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  habitIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 14, fontWeight: '600', color: '#1A1B2E', marginBottom: 2 },
  habitStreak: { flexDirection: 'row', gap: 10 },
  habitStreakText: { fontSize: 12, color: '#EA580C' },
  habitBestText: { fontSize: 12, color: '#9CA3AF' },
  habitRate: { alignItems: 'flex-end' },
  habitRateText: { fontSize: 16, fontWeight: '700', color: '#6C63FF' },
  habitRateLabel: { fontSize: 11, color: '#9CA3AF' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1B2E' },
});
