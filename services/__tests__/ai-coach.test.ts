import { getCheckinMessage, generateWeeklyInsights, suggestOptimalReminderTime } from '../ai-coach';

// Mock Supabase so edge functions are not called in tests
jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn().mockRejectedValue(new Error('network unavailable')),
    },
  },
}));

describe('getCheckinMessage fallback', () => {
  it('returns a non-empty string even when edge function fails', async () => {
    const msg = await getCheckinMessage({ habitName: 'Run', habitCategory: 'fitness', streakCount: 0 });
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('references day count for streaks < 7', async () => {
    const msg = await getCheckinMessage({ habitName: 'Meditate', habitCategory: 'mindfulness', streakCount: 3 });
    expect(msg).toContain('Day 4');
  });

  it('mentions streak count for streaks 7–29', async () => {
    const msg = await getCheckinMessage({ habitName: 'Read', habitCategory: 'learning', streakCount: 10 });
    expect(msg).toContain('11-day streak');
  });

  it('returns "Amazing" message for streaks >= 30', async () => {
    const msg = await getCheckinMessage({ habitName: 'Read', habitCategory: 'learning', streakCount: 30 });
    expect(msg).toContain('31 days strong');
  });

  it('returns first-day message for streak 0', async () => {
    const msg = await getCheckinMessage({ habitName: 'Yoga', habitCategory: 'fitness', streakCount: 0 });
    expect(msg).toContain('Every habit begins');
  });
});

describe('generateWeeklyInsights fallback', () => {
  const baseParams = {
    habits: [{ name: 'Run', category: 'fitness' as const, completionRate: 0.7, currentStreak: 3, daysCompleted: 5, daysTotal: 7 }],
    weekStart: '2026-03-31',
    weekEnd: '2026-04-06',
    overallCompletionRate: 0.7,
  };

  it('returns non-empty insights string when edge function fails', async () => {
    const result = await generateWeeklyInsights(baseParams);
    expect(typeof result.insights).toBe('string');
    expect(result.insights.length).toBeGreaterThan(0);
  });

  it('returns null stacking suggestion when edge function fails', async () => {
    const result = await generateWeeklyInsights(baseParams);
    expect(result.stackingSuggestion).toBeNull();
  });

  it('returns high-completion message for rate >= 0.8', async () => {
    const result = await generateWeeklyInsights({ ...baseParams, overallCompletionRate: 0.85 });
    expect(result.insights).toContain('Outstanding');
  });

  it('returns mid-completion message for rate 0.5–0.79', async () => {
    const result = await generateWeeklyInsights({ ...baseParams, overallCompletionRate: 0.6 });
    expect(result.insights).toContain('Solid week');
  });

  it('returns encouragement message for rate < 0.5', async () => {
    const result = await generateWeeklyInsights({ ...baseParams, overallCompletionRate: 0.2 });
    expect(result.insights).toContain('fresh start');
  });
});

describe('suggestOptimalReminderTime', () => {
  it('returns null with fewer than 3 data points', () => {
    expect(suggestOptimalReminderTime([])).toBeNull();
    expect(suggestOptimalReminderTime([new Date(2026, 3, 1, 8, 0).toISOString()])).toBeNull();
    expect(suggestOptimalReminderTime([
      new Date(2026, 3, 1, 8, 0).toISOString(),
      new Date(2026, 3, 2, 8, 0).toISOString(),
    ])).toBeNull();
  });

  it('returns a time string in HH:MM format with 3+ data points', () => {
    const times = [
      new Date(2026, 3, 1, 8, 0).toISOString(),
      new Date(2026, 3, 2, 8, 30).toISOString(),
      new Date(2026, 3, 3, 9, 0).toISOString(),
    ];
    const result = suggestOptimalReminderTime(times);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('suggests a time 30 minutes before average completion', () => {
    // All at 9:00 → avg = 9.0 → reminder at 8:30
    const times = [
      new Date(2026, 3, 1, 9, 0).toISOString(),
      new Date(2026, 3, 2, 9, 0).toISOString(),
      new Date(2026, 3, 3, 9, 0).toISOString(),
    ];
    const result = suggestOptimalReminderTime(times);
    expect(result).toBe('08:30');
  });
});
