import { supabase } from '@/lib/supabase';
import type { Habit, HabitLog, Profile, WeeklyInsight, HabitCategory, HabitFrequency, LogStatus } from './types';

// --- Profile ---

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    firebaseUid: row.firebase_uid as string,
    displayName: row.display_name as string | null,
    goal: row.goal as string | null,
    onboardingCompleted: row.onboarding_completed as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getOrCreateProfile(firebaseUid: string, displayName?: string): Promise<Profile> {
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single();

  if (existing && !fetchError) return rowToProfile(existing);

  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert({ firebase_uid: firebaseUid, display_name: displayName ?? null })
    .select()
    .single();

  if (createError) throw createError;
  return rowToProfile(created);
}

export async function updateProfile(profileId: string, updates: Partial<{ displayName: string; goal: string; onboardingCompleted: boolean }>): Promise<Profile> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.goal !== undefined) dbUpdates.goal = updates.goal;
  if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return rowToProfile(data);
}

// --- Habits ---

function rowToHabit(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    category: row.category as HabitCategory,
    icon: row.icon as string,
    description: row.description as string | null,
    frequency: row.frequency as HabitFrequency,
    reminderTime: row.reminder_time as string | null,
    notificationId: row.notification_id as string | null,
    isActive: row.is_active as boolean,
    isAiSuggested: row.is_ai_suggested as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToHabit);
}

export async function createHabit(params: {
  userId: string;
  name: string;
  category: HabitCategory;
  icon: string;
  description?: string;
  frequency?: HabitFrequency;
  reminderTime?: string;
  isAiSuggested?: boolean;
}): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: params.userId,
      name: params.name,
      category: params.category,
      icon: params.icon,
      description: params.description ?? null,
      frequency: params.frequency ?? 'daily',
      reminder_time: params.reminderTime ?? null,
      is_ai_suggested: params.isAiSuggested ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToHabit(data);
}

export async function updateHabit(habitId: string, updates: Partial<{
  name: string;
  category: HabitCategory;
  icon: string;
  description: string;
  reminderTime: string | null;
  notificationId: string | null;
  isActive: boolean;
}>): Promise<Habit> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.reminderTime !== undefined) dbUpdates.reminder_time = updates.reminderTime;
  if (updates.notificationId !== undefined) dbUpdates.notification_id = updates.notificationId;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('habits')
    .update(dbUpdates)
    .eq('id', habitId)
    .select()
    .single();

  if (error) throw error;
  return rowToHabit(data);
}

// --- Habit Logs ---

function rowToLog(row: Record<string, unknown>): HabitLog {
  return {
    id: row.id as string,
    habitId: row.habit_id as string,
    userId: row.user_id as string,
    logDate: row.log_date as string,
    status: row.status as LogStatus,
    completedAt: row.completed_at as string | null,
    aiMessage: row.ai_message as string | null,
    createdAt: row.created_at as string,
  };
}

export async function fetchLogsForDate(userId: string, date: string): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', date);

  if (error) throw error;
  return (data ?? []).map(rowToLog);
}

export async function fetchLogsForDateRange(userId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToLog);
}

export async function upsertHabitLog(params: {
  habitId: string;
  userId: string;
  logDate: string;
  status: LogStatus;
  aiMessage?: string;
}): Promise<HabitLog> {
  const { data, error } = await supabase
    .from('habit_logs')
    .upsert({
      habit_id: params.habitId,
      user_id: params.userId,
      log_date: params.logDate,
      status: params.status,
      completed_at: params.status === 'done' ? new Date().toISOString() : null,
      ai_message: params.aiMessage ?? null,
    }, { onConflict: 'habit_id,log_date' })
    .select()
    .single();

  if (error) throw error;
  return rowToLog(data);
}

// --- Streaks ---

export function calculateStreak(logs: HabitLog[], habitId: string): { current: number; best: number } {
  const doneDates = logs
    .filter((l) => l.habitId === habitId && l.status === 'done')
    .map((l) => l.logDate)
    .sort();

  if (doneDates.length === 0) return { current: 0, best: 0 };

  let current = 0;
  let best = 0;
  let streak = 1;

  // Check if today or yesterday was completed (to keep streak alive)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastDone = doneDates[doneDates.length - 1];
  const isActive = lastDone === today || lastDone === yesterday;

  for (let i = 1; i < doneDates.length; i++) {
    const prev = new Date(doneDates[i - 1]);
    const curr = new Date(doneDates[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      best = Math.max(best, streak);
      streak = 1;
    }
  }
  best = Math.max(best, streak);
  current = isActive ? streak : 0;

  return { current, best };
}

// --- Weekly Insights ---

function rowToInsight(row: Record<string, unknown>): WeeklyInsight {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    weekStart: row.week_start as string,
    weekEnd: row.week_end as string,
    insightsText: row.insights_text as string,
    habitStackingSuggestions: row.habit_stacking_suggestions as string | null,
    completionRate: row.completion_rate as number,
    createdAt: row.created_at as string,
  };
}

export async function fetchLatestInsight(userId: string): Promise<WeeklyInsight | null> {
  const { data, error } = await supabase
    .from('weekly_insights')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return rowToInsight(data);
}

export async function saveWeeklyInsight(params: {
  userId: string;
  weekStart: string;
  weekEnd: string;
  insightsText: string;
  habitStackingSuggestions: string | null;
  completionRate: number;
}): Promise<WeeklyInsight> {
  const { data, error } = await supabase
    .from('weekly_insights')
    .upsert({
      user_id: params.userId,
      week_start: params.weekStart,
      week_end: params.weekEnd,
      insights_text: params.insightsText,
      habit_stacking_suggestions: params.habitStackingSuggestions,
      completion_rate: params.completionRate,
    }, { onConflict: 'user_id,week_start' })
    .select()
    .single();

  if (error) throw error;
  return rowToInsight(data);
}
