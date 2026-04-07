import { supabase } from '@/lib/supabase';
import type { HabitCategory } from './types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

/**
 * Get an AI motivational message after completing a habit.
 * Falls back to a local message if the edge function is unavailable.
 */
export async function getCheckinMessage(params: {
  habitName: string;
  habitCategory: HabitCategory;
  streakCount: number;
}): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-checkin', {
      body: {
        habitName: params.habitName,
        habitCategory: params.habitCategory,
        streakCount: params.streakCount,
        timeOfDay: getTimeOfDay(),
      },
    });

    if (error) throw error;
    return data?.message ?? getFallbackMessage(params.streakCount);
  } catch {
    return getFallbackMessage(params.streakCount);
  }
}

function getFallbackMessage(streak: number): string {
  if (streak === 0) return 'Great start! Every habit begins with a single step.';
  if (streak < 7) return `Day ${streak + 1} done. You're building momentum!`;
  if (streak < 30) return `${streak + 1}-day streak! Consistency is your superpower.`;
  return `Amazing! ${streak + 1} days strong. You're unstoppable.`;
}

export interface HabitStats {
  name: string;
  category: HabitCategory;
  completionRate: number;
  currentStreak: number;
  daysCompleted: number;
  daysTotal: number;
}

/**
 * Generate weekly AI insights based on habit performance.
 */
export async function generateWeeklyInsights(params: {
  habits: HabitStats[];
  weekStart: string;
  weekEnd: string;
  overallCompletionRate: number;
}): Promise<{ insights: string; stackingSuggestion: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('weekly-insights', {
      body: params,
    });

    if (error) throw error;
    return {
      insights: data?.insights ?? getDefaultInsights(params.overallCompletionRate),
      stackingSuggestion: data?.stackingSuggestion ?? null,
    };
  } catch {
    return {
      insights: getDefaultInsights(params.overallCompletionRate),
      stackingSuggestion: null,
    };
  }
}

function getDefaultInsights(completionRate: number): string {
  if (completionRate >= 0.8) {
    return 'Outstanding week! You completed most of your habits consistently. Keep up the great work and your routines will become effortless.';
  }
  if (completionRate >= 0.5) {
    return 'Solid week with good progress! You showed up for more than half your habits. Focus on the ones you struggled with — small wins compound over time.';
  }
  return 'Every week is a fresh start. Identify one habit to prioritize next week and build from there. Consistency beats perfection.';
}

/**
 * Analyze completion patterns to suggest optimal reminder time.
 * Returns "HH:MM" format or null if not enough data.
 */
export function suggestOptimalReminderTime(completionTimes: string[]): string | null {
  if (completionTimes.length < 3) return null;

  const hours = completionTimes.map((t) => {
    const d = new Date(t);
    return d.getHours() + d.getMinutes() / 60;
  });

  const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;
  // Suggest reminder 30 min before average completion time
  const reminderHour = Math.max(0, Math.floor(avgHour - 0.5));
  const reminderMin = avgHour % 1 >= 0.5 ? 0 : 30;

  return `${String(reminderHour).padStart(2, '0')}:${String(reminderMin).padStart(2, '0')}`;
}
