import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { useHabitStore } from '@/stores/habit-store';
import { useAnalytics, AnalyticsEvents } from '@/services/analytics';

function formatWeek(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${s} – ${e}`;
}

export default function InsightsScreen() {
  const { isSignedIn, userId } = useAuth();
  const {
    loadHabits,
    loadRecentLogs,
    loadProfile,
    loadLatestInsight,
    generateInsights,
    profile,
    habits,
    latestInsight,
  } = useHabitStore();
  const analytics = useAnalytics();

  const [generating, setGenerating] = useState(false);
  const insightViewStartRef = useRef<number | null>(null);
  const viewedInsightIdRef = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    await loadProfile(userId);
    const currentProfile = useHabitStore.getState().profile;
    if (!currentProfile) return;
    await Promise.all([
      loadHabits(currentProfile.id),
      loadRecentLogs(currentProfile.id),
      loadLatestInsight(currentProfile.id),
    ]);
  }, [userId, loadProfile, loadHabits, loadRecentLogs, loadLatestInsight]);

  useEffect(() => {
    if (isSignedIn) loadData();
  }, [isSignedIn, loadData]);

  // Fire weekly_insight_viewed when insight is present and not yet tracked
  useEffect(() => {
    if (!latestInsight) return;
    if (viewedInsightIdRef.current === latestInsight.id) return;

    viewedInsightIdRef.current = latestInsight.id;
    insightViewStartRef.current = Date.now();

    const period = `${latestInsight.weekStart}_${latestInsight.weekEnd}`;
    const ev = AnalyticsEvents.Progress.weeklyInsightViewed(latestInsight.id, period, 0);
    analytics.logEvent(ev.name, ev.params);
  }, [latestInsight, analytics]);

  const handleGenerate = async () => {
    if (!profile) return;
    setGenerating(true);
    try {
      await generateInsights(profile.id);

      const ev = AnalyticsEvents.AI.aiInsightGenerated('weekly_habits', habits.length);
      analytics.logEvent(ev.name, ev.params);
    } finally {
      setGenerating(false);
    }
  };

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🤖</Text>
          <Text style={styles.emptyTitle}>Sign in for AI insights</Text>
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
        <Text style={styles.title}>AI Insights</Text>
        <Text style={styles.subtitle}>Weekly analysis powered by Claude</Text>

        {habits.length < 3 && (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeIcon}>💡</Text>
            <Text style={styles.noticeText}>
              Track at least 3 habits for a full week to get personalized insights.
            </Text>
          </View>
        )}

        {latestInsight && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightWeek}>
                {formatWeek(latestInsight.weekStart, latestInsight.weekEnd)}
              </Text>
              <View style={styles.ratePill}>
                <Text style={styles.ratePillText}>
                  {Math.round(latestInsight.completionRate * 100)}% completion
                </Text>
              </View>
            </View>

            <Text style={styles.insightLabel}>Weekly Summary</Text>
            <Text style={styles.insightText}>{latestInsight.insightsText}</Text>

            {latestInsight.habitStackingSuggestions && (
              <View style={styles.stackCard}>
                <Text style={styles.stackTitle}>🔗 Habit Stacking Suggestion</Text>
                <Text style={styles.stackText}>{latestInsight.habitStackingSuggestions}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonLoading]}
          onPress={handleGenerate}
          disabled={generating || habits.length === 0}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.generateIcon}>✨</Text>
              <Text style={styles.generateText}>
                {latestInsight ? 'Regenerate Insights' : 'Generate This Week\'s Insights'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {habits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits to analyze yet</Text>
            <Text style={styles.emptySubtitle}>Add habits and track them for a week to get AI insights</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How insights work</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📊</Text>
            <Text style={styles.infoText}>Analyzes your 7-day habit completion patterns</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🤖</Text>
            <Text style={styles.infoText}>Powered by Claude Sonnet AI</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🔗</Text>
            <Text style={styles.infoText}>Suggests habit stacking combinations</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>Refreshes weekly for ongoing guidance</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scroll: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1B2E', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B8FA8', marginBottom: 20 },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
    alignItems: 'flex-start',
  },
  noticeIcon: { fontSize: 18 },
  noticeText: { flex: 1, fontSize: 14, color: '#92400E', lineHeight: 20 },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E8EAF2',
    gap: 12,
  },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insightWeek: { fontSize: 13, fontWeight: '600', color: '#8B8FA8' },
  ratePill: {
    backgroundColor: '#F4F3FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratePillText: { fontSize: 12, color: '#6C63FF', fontWeight: '700' },
  insightLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
  insightText: { fontSize: 15, color: '#374151', lineHeight: 24 },
  stackCard: {
    backgroundColor: '#F4F3FF',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  stackTitle: { fontSize: 13, fontWeight: '700', color: '#6C63FF' },
  stackText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  generateButtonLoading: { opacity: 0.7 },
  generateIcon: { fontSize: 18 },
  generateText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1B2E' },
  emptySubtitle: { fontSize: 14, color: '#8B8FA8', textAlign: 'center', lineHeight: 20 },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EAF2',
    gap: 12,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#1A1B2E', marginBottom: 4 },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoIcon: { fontSize: 16, width: 24 },
  infoText: { flex: 1, fontSize: 14, color: '#6B6F8A', lineHeight: 20 },
});
