// Mock supabase before importing habits (which imports supabase → firebase)
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    functions: { invoke: jest.fn() },
  },
}));

import { calculateStreak } from '../habits';
import type { HabitLog } from '../types';

function makeLog(habitId: string, logDate: string, status: 'done' | 'skipped' | 'pending' = 'done'): HabitLog {
  return {
    id: `log-${habitId}-${logDate}`,
    habitId,
    userId: 'user-1',
    logDate,
    status,
    completedAt: status === 'done' ? new Date().toISOString() : null,
    aiMessage: null,
    createdAt: new Date().toISOString(),
  };
}

const TODAY = new Date().toISOString().split('T')[0];
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const TWO_DAYS_AGO = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
const THREE_DAYS_AGO = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

describe('calculateStreak', () => {
  it('returns zero streak with no logs', () => {
    expect(calculateStreak([], 'habit-1')).toEqual({ current: 0, best: 0 });
  });

  it('returns zero streak when no done logs exist', () => {
    const logs = [makeLog('habit-1', TODAY, 'skipped')];
    expect(calculateStreak(logs, 'habit-1')).toEqual({ current: 0, best: 0 });
  });

  it('counts streak of 1 when only today is done', () => {
    const logs = [makeLog('habit-1', TODAY)];
    const result = calculateStreak(logs, 'habit-1');
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });

  it('counts streak of 1 when only yesterday is done', () => {
    const logs = [makeLog('habit-1', YESTERDAY)];
    const result = calculateStreak(logs, 'habit-1');
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });

  it('returns current 0 when last done was 2+ days ago', () => {
    const logs = [makeLog('habit-1', TWO_DAYS_AGO)];
    const result = calculateStreak(logs, 'habit-1');
    expect(result.current).toBe(0);
    expect(result.best).toBe(1);
  });

  it('accumulates consecutive streak ending today', () => {
    const logs = [
      makeLog('habit-1', THREE_DAYS_AGO),
      makeLog('habit-1', TWO_DAYS_AGO),
      makeLog('habit-1', YESTERDAY),
      makeLog('habit-1', TODAY),
    ];
    const result = calculateStreak(logs, 'habit-1');
    expect(result.current).toBe(4);
    expect(result.best).toBe(4);
  });

  it('accumulates consecutive streak ending yesterday', () => {
    const logs = [
      makeLog('habit-1', TWO_DAYS_AGO),
      makeLog('habit-1', YESTERDAY),
    ];
    const result = calculateStreak(logs, 'habit-1');
    expect(result.current).toBe(2);
    expect(result.best).toBe(2);
  });

  it('resets streak after a gap and tracks best', () => {
    // 3-day streak broken, then 2-day streak ending yesterday
    const fourDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0];
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
    const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
    const logs = [
      makeLog('habit-1', sixDaysAgo),
      makeLog('habit-1', fiveDaysAgo),
      makeLog('habit-1', fourDaysAgo),
      // gap on THREE_DAYS_AGO
      makeLog('habit-1', TWO_DAYS_AGO),
      makeLog('habit-1', YESTERDAY),
    ];
    const result = calculateStreak(logs, 'habit-1');
    expect(result.current).toBe(2);
    expect(result.best).toBe(3);
  });

  it('ignores logs from other habits', () => {
    const logs = [
      makeLog('habit-2', TODAY),
      makeLog('habit-2', YESTERDAY),
      makeLog('habit-1', TODAY),
    ];
    const result = calculateStreak(logs, 'habit-1');
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });

  it('ignores skipped logs in streak count', () => {
    const logs = [
      makeLog('habit-1', YESTERDAY, 'skipped'),
      makeLog('habit-1', TODAY, 'done'),
    ];
    const result = calculateStreak(logs, 'habit-1');
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });
});
