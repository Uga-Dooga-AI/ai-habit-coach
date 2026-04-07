export type HabitCategory = 'health' | 'mindfulness' | 'fitness' | 'learning' | 'productivity' | 'general';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends';
export type LogStatus = 'done' | 'skipped' | 'missed' | 'pending';
export type SubscriptionTier = 'free' | 'premium' | 'trial';

export interface Profile {
  id: string;
  firebaseUid: string;
  displayName: string | null;
  goal: string | null;
  onboardingCompleted: boolean;
  subscriptionTier: SubscriptionTier;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  icon: string;
  description: string | null;
  frequency: HabitFrequency;
  reminderTime: string | null; // "HH:MM"
  notificationId: string | null;
  isActive: boolean;
  isAiSuggested: boolean;
  archivedAt: string | null;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  logDate: string; // "YYYY-MM-DD"
  status: LogStatus;
  completedAt: string | null;
  aiMessage: string | null;
  createdAt: string;
}

export interface WeeklyInsight {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  insightsText: string;
  habitStackingSuggestions: string | null;
  completionRate: number;
  createdAt: string;
}

export interface HabitWithStreak extends Habit {
  currentStreak: number;
  bestStreak: number;
  todayLog: HabitLog | null;
}

export const HABIT_CATALOG: Array<{
  name: string;
  category: HabitCategory;
  icon: string;
  description: string;
}> = [
  { name: 'Morning Meditation', category: 'mindfulness', icon: '🧘', description: '5-10 minutes of mindful breathing' },
  { name: 'Daily Exercise', category: 'fitness', icon: '💪', description: '30 minutes of physical activity' },
  { name: 'Read for 20 Minutes', category: 'learning', icon: '📚', description: 'Read books, articles, or educational content' },
  { name: 'Drink 8 Glasses of Water', category: 'health', icon: '💧', description: 'Stay hydrated throughout the day' },
  { name: 'Journaling', category: 'mindfulness', icon: '📝', description: 'Write down thoughts, gratitude, or goals' },
  { name: 'Evening Walk', category: 'fitness', icon: '🚶', description: 'A relaxing 20-minute walk' },
  { name: 'No Phone Before Bed', category: 'health', icon: '📵', description: 'Digital detox 1 hour before sleep' },
  { name: 'Learn Something New', category: 'learning', icon: '🎯', description: 'Spend 15 min on a new skill or topic' },
  { name: 'Healthy Breakfast', category: 'health', icon: '🥗', description: 'Start the day with a nutritious meal' },
  { name: 'Deep Work Block', category: 'productivity', icon: '⚡', description: '90-minute focused work session' },
  { name: 'Gratitude Practice', category: 'mindfulness', icon: '🙏', description: 'Write down 3 things you are grateful for' },
  { name: 'Stretching', category: 'fitness', icon: '🤸', description: '10 minutes of morning or evening stretching' },
];

export const GOAL_OPTIONS = [
  { id: 'build_consistency', label: 'Build Consistency', icon: '🔄', description: 'Establish daily routines that stick' },
  { id: 'improve_health', label: 'Improve Health', icon: '❤️', description: 'Better sleep, nutrition, and fitness' },
  { id: 'reduce_stress', label: 'Reduce Stress', icon: '🌿', description: 'Mindfulness, relaxation, and balance' },
  { id: 'boost_productivity', label: 'Boost Productivity', icon: '🚀', description: 'Focus, deep work, and efficiency' },
  { id: 'personal_growth', label: 'Personal Growth', icon: '📈', description: 'Learning, skills, and self-improvement' },
];
