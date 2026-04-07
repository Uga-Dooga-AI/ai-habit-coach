// Sprint 2 Acceptance Tests
// Covers business-logic layers testable before Sprint 2 UI is complete.
// UI-layer tests (PaywallModal, PaywallScreen, SettingsScreen) are marked
// .todo() — they require feature dev from UGAAAAA-255.
//
// Sections:
//   1. Habit CRUD — service-layer (updateHabit, createHabit, archiveHabit)
//   2. Free-tier limit helpers (enforcement logic once subscription-store lands)
//   3. Settings store (quiet hours, per-habit notifications) — .todo()
//   4. Paywall UI — .todo()
//   5. Regression smoke — Sprint 1 exports still importable

// ---------------------------------------------------------------------------
// Mocks (hoisted via jest.mock — factories must be self-contained)
// ---------------------------------------------------------------------------

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/services/notifications', () => ({
  scheduleDailyReminder: jest.fn().mockResolvedValue('notif-123'),
  cancelHabitReminder: jest.fn().mockResolvedValue(undefined),
  requestNotificationPermission: jest.fn().mockResolvedValue(true),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are hoisted)
// ---------------------------------------------------------------------------

import { supabase } from '@/lib/supabase';
import { updateHabit, createHabit } from '../habits';
import type { Habit } from '../types';

// Typed reference to the mocked `from`
const mockFrom = supabase.from as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    userId: 'user-1',
    name: 'Morning Run',
    category: 'fitness',
    icon: '🏃',
    description: null,
    frequency: 'daily',
    reminderTime: null,
    notificationId: null,
    isActive: true,
    isAiSuggested: false,
    archivedAt: null,
    notificationsEnabled: true,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Convert a Habit to its Supabase row (snake_case) representation. */
function habitToRow(h: Habit): Record<string, unknown> {
  return {
    id: h.id,
    user_id: h.userId,
    name: h.name,
    category: h.category,
    icon: h.icon,
    description: h.description,
    frequency: h.frequency,
    reminder_time: h.reminderTime,
    notification_id: h.notificationId,
    is_active: h.isActive,
    is_ai_suggested: h.isAiSuggested,
    created_at: h.createdAt,
    updated_at: h.updatedAt,
  };
}

/**
 * Set up the supabase mock so that the fluent chain resolves with `row`.
 * Covers both update (.update().eq().select().single()) and
 * insert (.insert().select().single()) call patterns.
 */
function setupSupabaseMockResolving(row: Record<string, unknown>): void {
  const singleFn = jest.fn().mockResolvedValue({ data: row, error: null });
  const selectFn = jest.fn().mockReturnValue({ single: singleFn });
  const eqFn = jest.fn().mockReturnValue({ select: selectFn, single: singleFn, eq: jest.fn().mockReturnThis() });
  const chain = {
    select: selectFn,
    single: singleFn,
    eq: eqFn,
    update: jest.fn().mockReturnValue({ eq: eqFn }),
    insert: jest.fn().mockReturnValue({ select: selectFn }),
    upsert: jest.fn().mockReturnValue({ select: selectFn }),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
  mockFrom.mockReturnValue(chain);
}

/** Set up the supabase mock to return an error on the final .single() call. */
function setupSupabaseMockRejecting(message: string): void {
  const singleFn = jest.fn().mockResolvedValue({ data: null, error: new Error(message) });
  const selectFn = jest.fn().mockReturnValue({ single: singleFn });
  const eqFn = jest.fn().mockReturnValue({ select: selectFn, single: singleFn });
  const chain = {
    select: selectFn,
    single: singleFn,
    eq: eqFn,
    update: jest.fn().mockReturnValue({ eq: eqFn }),
    insert: jest.fn().mockReturnValue({ select: selectFn }),
  };
  mockFrom.mockReturnValue(chain);
}

// ---------------------------------------------------------------------------
// 1. Habit CRUD — service layer
// ---------------------------------------------------------------------------

describe('Habit Edit (updateHabit)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates habit name and returns the updated habit', async () => {
    const updated = makeHabit({ name: 'Evening Run' });
    setupSupabaseMockResolving(habitToRow(updated));

    const result = await updateHabit('habit-1', { name: 'Evening Run' });

    expect(result.name).toBe('Evening Run');
    expect(result.id).toBe('habit-1');
  });

  it('updates habit category', async () => {
    const updated = makeHabit({ category: 'mindfulness' });
    setupSupabaseMockResolving(habitToRow(updated));

    const result = await updateHabit('habit-1', { category: 'mindfulness' });

    expect(result.category).toBe('mindfulness');
  });

  it('updates reminder time', async () => {
    const updated = makeHabit({ reminderTime: '08:30' });
    setupSupabaseMockResolving(habitToRow(updated));

    const result = await updateHabit('habit-1', { reminderTime: '08:30' });

    expect(result.reminderTime).toBe('08:30');
  });

  it('updates icon and description', async () => {
    const updated = makeHabit({ icon: '🧘', description: 'Daily yoga practice' });
    setupSupabaseMockResolving(habitToRow(updated));

    const result = await updateHabit('habit-1', { icon: '🧘', description: 'Daily yoga practice' });

    expect(result.icon).toBe('🧘');
    expect(result.description).toBe('Daily yoga practice');
  });

  it('throws when supabase returns an error', async () => {
    setupSupabaseMockRejecting('DB error');

    await expect(updateHabit('habit-1', { name: 'Fail' })).rejects.toThrow('DB error');
  });
});

describe('Habit Archive (updateHabit with isActive: false)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets isActive to false (soft-delete)', async () => {
    const archived = makeHabit({ isActive: false });
    setupSupabaseMockResolving(habitToRow(archived));

    const result = await updateHabit('habit-1', { isActive: false });

    expect(result.isActive).toBe(false);
  });

  it('archived habit retains its id', async () => {
    const archived = makeHabit({ id: 'habit-archived', isActive: false });
    setupSupabaseMockResolving(habitToRow(archived));

    const result = await updateHabit('habit-archived', { isActive: false });

    expect(result.id).toBe('habit-archived');
    expect(result.isActive).toBe(false);
  });
});

describe('Habit Create (createHabit)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates habit with required fields and returns new habit', async () => {
    const habit = makeHabit({ id: 'new-habit', name: 'Yoga', category: 'fitness', icon: '🧘' });
    setupSupabaseMockResolving(habitToRow(habit));

    const result = await createHabit({
      userId: 'user-1',
      name: 'Yoga',
      category: 'fitness',
      icon: '🧘',
    });

    expect(result.name).toBe('Yoga');
    expect(result.isActive).toBe(true);
    expect(result.frequency).toBe('daily'); // default
  });

  it('creates habit with optional reminder time', async () => {
    const habit = makeHabit({ id: 'h2', name: 'Walk', reminderTime: '07:00' });
    setupSupabaseMockResolving(habitToRow(habit));

    const result = await createHabit({
      userId: 'user-1',
      name: 'Walk',
      category: 'fitness',
      icon: '🚶',
      reminderTime: '07:00',
    });

    expect(result.reminderTime).toBe('07:00');
  });

  it('creates AI-suggested habit with isAiSuggested flag', async () => {
    const habit = makeHabit({ id: 'h3', name: 'Meditate', isAiSuggested: true });
    setupSupabaseMockResolving(habitToRow(habit));

    const result = await createHabit({
      userId: 'user-1',
      name: 'Meditate',
      category: 'mindfulness',
      icon: '🧘',
      isAiSuggested: true,
    });

    expect(result.isAiSuggested).toBe(true);
  });

  it('throws when supabase returns an error on create', async () => {
    setupSupabaseMockRejecting('Insert failed');

    await expect(
      createHabit({ userId: 'user-1', name: 'Bad', category: 'general', icon: '❓' }),
    ).rejects.toThrow('Insert failed');
  });
});

// ---------------------------------------------------------------------------
// 2. Free-tier limit — subscription enforcement logic
// ---------------------------------------------------------------------------
//
// These tests are stubs for the canAddHabit() helper that Sprint 2 Feature Dev
// (UGAAAAA-255) will add to the subscription store / paywall service.
// Once the module exists at @/services/subscription or @/stores/subscription-store,
// remove the .todo() and add the real import + assertions.

describe('Free-tier habit limit (subscription gate)', () => {
  it.todo('free user with 0–2 habits: canAddHabit() returns true');
  it.todo('free user with exactly 3 habits: canAddHabit() returns false → triggers paywall');
  it.todo('pro/trial user with 3+ habits: canAddHabit() always returns true');
  it.todo('expired subscription treated as free (canAddHabit false at habit count ≥ 3)');
});

// ---------------------------------------------------------------------------
// 3. Settings store — quiet hours + per-habit notification toggles
// ---------------------------------------------------------------------------
//
// Will test against a settings store (e.g. @/stores/settings-store) once
// Sprint 2 Feature Dev (UGAAAAA-255) ships that module.

describe('Settings — quiet hours', () => {
  it.todo('setting quiet hours persists start/end to AsyncStorage');
  it.todo('reading quiet hours returns previously persisted values after store rehydration');
  it.todo('quiet hours default is null / not set on first launch');
});

describe('Settings — per-habit notification toggle', () => {
  it.todo('disabling notification for a habit cancels its scheduled reminder');
  it.todo('enabling notification for a habit schedules a reminder if permission granted');
  it.todo('notification enabled state persists across store rehydration');
});

describe('Settings — account', () => {
  it.todo('logout clears auth session and resets auth store to unauthenticated state');
  it.todo('app version string is non-empty and matches app.json version');
});

// ---------------------------------------------------------------------------
// 4. Paywall UI — component-level (React Native Testing Library)
// ---------------------------------------------------------------------------
//
// Requires PaywallModal and PaywallScreen components from Sprint 2 Feature Dev.

describe('PaywallModal', () => {
  it.todo('renders "Start Trial" button');
  it.todo('renders "Restore Purchases" button');
  it.todo('renders "Close" button');
  it.todo('Close button dismisses modal without initiating purchase');
  it.todo('Start Trial button calls RevenueCat purchase flow');
});

describe('PaywallScreen', () => {
  it.todo('displays monthly plan with price');
  it.todo('displays annual plan with price');
  it.todo('selecting annual plan highlights it and deselects monthly');
});

describe('SubscriptionManagement screen', () => {
  it.todo('restore purchases flow completes without crash when no prior purchase exists');
  it.todo('successful restore reflects active subscription in subscription store');
});

describe('RevenueCat deferred / QA mode', () => {
  it.todo('app initializes without crash when REVENUECAT_API_KEY env var is absent');
  it.todo('mock trial activates correctly for [TESTABLE] QA builds');
});

// ---------------------------------------------------------------------------
// 5. Regression — Sprint 1 public API surface still intact
// ---------------------------------------------------------------------------

describe('Sprint 1 regression — public API surface', () => {
  it('calculateStreak is still exported from habits service', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { calculateStreak } = require('../habits');
    expect(typeof calculateStreak).toBe('function');
  });

  it('getCheckinMessage is still exported from ai-coach service', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getCheckinMessage } = require('../ai-coach');
    expect(typeof getCheckinMessage).toBe('function');
  });

  it('generateWeeklyInsights is still exported from ai-coach service', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { generateWeeklyInsights } = require('../ai-coach');
    expect(typeof generateWeeklyInsights).toBe('function');
  });

  it('suggestOptimalReminderTime is still exported from ai-coach service', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { suggestOptimalReminderTime } = require('../ai-coach');
    expect(typeof suggestOptimalReminderTime).toBe('function');
  });
});
