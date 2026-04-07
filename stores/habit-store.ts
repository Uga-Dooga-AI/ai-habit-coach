import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchHabits,
  createHabit,
  updateHabit,
  fetchLogsForDate,
  fetchLogsForDateRange,
  upsertHabitLog,
  calculateStreak,
  fetchLatestInsight,
  saveWeeklyInsight,
  getOrCreateProfile,
  updateProfile,
} from '@/services/habits';
import { getCheckinMessage, generateWeeklyInsights } from '@/services/ai-coach';
import {
  scheduleDailyReminder,
  cancelHabitReminder,
  requestNotificationPermission,
} from '@/services/notifications';
import type { Habit, HabitLog, HabitWithStreak, Profile, WeeklyInsight, HabitCategory, HabitFrequency } from '@/services/types';

const CACHE_PREFIX = 'habit_logs_';
const PROFILE_CACHE_KEY = 'profile_cache';

interface HabitState {
  habits: Habit[];
  todayLogs: HabitLog[];
  recentLogs: HabitLog[]; // last 30 days
  profile: Profile | null;
  latestInsight: WeeklyInsight | null;
  loading: boolean;
  error: string | null;
  today: string; // "YYYY-MM-DD"
}

interface HabitActions {
  loadProfile: (firebaseUid: string) => Promise<void>;
  loadHabits: (userId: string) => Promise<void>;
  loadTodayLogs: (userId: string) => Promise<void>;
  loadRecentLogs: (userId: string) => Promise<void>;
  loadLatestInsight: (userId: string) => Promise<void>;

  completeHabit: (habitId: string, userId: string) => Promise<string>;
  skipHabit: (habitId: string, userId: string) => Promise<void>;

  addHabit: (params: {
    userId: string;
    name: string;
    category: HabitCategory;
    icon: string;
    description?: string;
    frequency?: HabitFrequency;
    reminderTime?: string;
    isAiSuggested?: boolean;
  }) => Promise<Habit>;

  setHabitReminder: (habitId: string, reminderTime: string) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;

  completeOnboarding: (profileId: string, goal: string) => Promise<void>;
  generateInsights: (userId: string) => Promise<void>;

  habitsWithStreaks: () => HabitWithStreak[];
  completionRateToday: () => number;
  completionRateLast7Days: () => number;
}

export const useHabitStore = create<HabitState & HabitActions>((set, get) => ({
  habits: [],
  todayLogs: [],
  recentLogs: [],
  profile: null,
  latestInsight: null,
  loading: false,
  error: null,
  today: new Date().toISOString().split('T')[0],

  loadProfile: async (firebaseUid) => {
    try {
      // Try cache first
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Profile;
        if (parsed.firebaseUid === firebaseUid) {
          set({ profile: parsed });
        }
      }

      const profile = await getOrCreateProfile(firebaseUid);
      set({ profile });
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } catch (e) {
      // Use cached profile if available, don't throw
      console.warn('loadProfile error:', e);
    }
  },

  loadHabits: async (userId) => {
    set({ loading: true, error: null });
    try {
      const habits = await fetchHabits(userId);
      set({ habits, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  loadTodayLogs: async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    set({ today });

    // Try cache first
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${today}`);
      if (cached) {
        set({ todayLogs: JSON.parse(cached) });
      }
    } catch {
      // ignore cache errors
    }

    try {
      const logs = await fetchLogsForDate(userId, today);
      set({ todayLogs: logs });
      await AsyncStorage.setItem(`${CACHE_PREFIX}${today}`, JSON.stringify(logs));
    } catch (e) {
      console.warn('loadTodayLogs error:', e);
    }
  },

  loadRecentLogs: async (userId) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    try {
      const logs = await fetchLogsForDateRange(userId, start, end);
      set({ recentLogs: logs });
    } catch (e) {
      console.warn('loadRecentLogs error:', e);
    }
  },

  loadLatestInsight: async (userId) => {
    try {
      const insight = await fetchLatestInsight(userId);
      set({ latestInsight: insight });
    } catch (e) {
      console.warn('loadLatestInsight error:', e);
    }
  },

  completeHabit: async (habitId, userId) => {
    const { habits, recentLogs, today } = get();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return 'Well done!';

    const { current: streak } = calculateStreak(recentLogs, habitId);

    // Get AI message (non-blocking)
    const aiMessage = await getCheckinMessage({
      habitName: habit.name,
      habitCategory: habit.category,
      streakCount: streak,
    });

    const log = await upsertHabitLog({
      habitId,
      userId,
      logDate: today,
      status: 'done',
      aiMessage,
    });

    set((state) => ({
      todayLogs: [
        ...state.todayLogs.filter((l) => l.habitId !== habitId),
        log,
      ],
      recentLogs: [
        ...state.recentLogs.filter((l) => !(l.habitId === habitId && l.logDate === today)),
        log,
      ],
    }));

    // Update cache
    const { todayLogs } = get();
    await AsyncStorage.setItem(`${CACHE_PREFIX}${today}`, JSON.stringify(todayLogs)).catch(() => {});

    return aiMessage;
  },

  skipHabit: async (habitId, userId) => {
    const { today } = get();
    const log = await upsertHabitLog({
      habitId,
      userId,
      logDate: today,
      status: 'skipped',
    });

    set((state) => ({
      todayLogs: [
        ...state.todayLogs.filter((l) => l.habitId !== habitId),
        log,
      ],
    }));
  },

  addHabit: async (params) => {
    const habit = await createHabit(params);

    if (params.reminderTime) {
      const granted = await requestNotificationPermission();
      if (granted) {
        const notifId = await scheduleDailyReminder({
          habitId: habit.id,
          habitName: habit.name,
          reminderTime: params.reminderTime,
        });
        await updateHabit(habit.id, { notificationId: notifId });
      }
    }

    set((state) => ({ habits: [...state.habits, habit] }));
    return habit;
  },

  setHabitReminder: async (habitId, reminderTime) => {
    const { habits } = get();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const granted = await requestNotificationPermission();
    if (!granted) return;

    const notifId = await scheduleDailyReminder({
      habitId,
      habitName: habit.name,
      reminderTime,
    });

    const updated = await updateHabit(habitId, {
      reminderTime,
      notificationId: notifId,
    });

    set((state) => ({
      habits: state.habits.map((h) => (h.id === habitId ? updated : h)),
    }));
  },

  archiveHabit: async (habitId) => {
    await updateHabit(habitId, { isActive: false });
    await cancelHabitReminder(habitId);
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
    }));
  },

  completeOnboarding: async (profileId, goal) => {
    const profile = await updateProfile(profileId, {
      goal,
      onboardingCompleted: true,
    });
    set({ profile });
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  },

  generateInsights: async (userId) => {
    const { habits, recentLogs } = get();
    if (habits.length === 0) return;

    const today = new Date();
    const weekEnd = today.toISOString().split('T')[0];
    const weekStart = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];

    const weekLogs = recentLogs.filter(
      (l) => l.logDate >= weekStart && l.logDate <= weekEnd,
    );

    const habitStats = habits.map((h) => {
      const hLogs = weekLogs.filter((l) => l.habitId === h.id);
      const doneLogs = hLogs.filter((l) => l.status === 'done');
      const { current } = calculateStreak(recentLogs, h.id);
      return {
        name: h.name,
        category: h.category,
        completionRate: hLogs.length > 0 ? doneLogs.length / 7 : 0,
        currentStreak: current,
        daysCompleted: doneLogs.length,
        daysTotal: 7,
      };
    });

    const totalDone = weekLogs.filter((l) => l.status === 'done').length;
    const totalExpected = habits.length * 7;
    const overallRate = totalExpected > 0 ? totalDone / totalExpected : 0;

    const { insights, stackingSuggestion } = await generateWeeklyInsights({
      habits: habitStats,
      weekStart,
      weekEnd,
      overallCompletionRate: overallRate,
    });

    const saved = await saveWeeklyInsight({
      userId,
      weekStart,
      weekEnd,
      insightsText: insights,
      habitStackingSuggestions: stackingSuggestion,
      completionRate: overallRate,
    });

    set({ latestInsight: saved });
  },

  habitsWithStreaks: () => {
    const { habits, recentLogs, todayLogs } = get();
    return habits.map((h) => {
      const { current, best } = calculateStreak(recentLogs, h.id);
      const todayLog = todayLogs.find((l) => l.habitId === h.id) ?? null;
      return { ...h, currentStreak: current, bestStreak: best, todayLog };
    });
  },

  completionRateToday: () => {
    const { habits, todayLogs } = get();
    if (habits.length === 0) return 0;
    const done = todayLogs.filter((l) => l.status === 'done').length;
    return done / habits.length;
  },

  completionRateLast7Days: () => {
    const { habits, recentLogs } = get();
    if (habits.length === 0) return 0;
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const recent = recentLogs.filter((l) => l.logDate >= cutoff && l.status === 'done');
    return recent.length / (habits.length * 7);
  },
}));
