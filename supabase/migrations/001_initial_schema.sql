-- AI Habit Coach initial schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (linked to Firebase UID)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  display_name TEXT,
  goal TEXT, -- e.g. "build_consistency", "improve_health", "reduce_stress"
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- health, mindfulness, fitness, learning, productivity
  icon TEXT NOT NULL DEFAULT '✨',
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily', -- daily | weekdays | weekends | custom
  reminder_time TEXT, -- "HH:MM" in local time
  notification_id TEXT, -- Expo notification identifier
  is_active BOOLEAN DEFAULT TRUE,
  is_ai_suggested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit logs (one per habit per day)
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- done | skipped | missed | pending
  completed_at TIMESTAMPTZ,
  ai_message TEXT, -- AI motivational message shown on completion
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

-- Weekly insights
CREATE TABLE IF NOT EXISTS weekly_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  insights_text TEXT NOT NULL,
  habit_stacking_suggestions TEXT,
  completion_rate NUMERIC(5,2),
  best_habit_id UUID REFERENCES habits(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_weekly_insights_user ON weekly_insights(user_id, week_start);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies (Firebase JWT auth: uid is in the JWT sub claim)
-- Profiles: users can only access their own profile
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Habits: users can only access their own habits
CREATE POLICY "habits_own" ON habits
  FOR ALL USING (
    user_id = (
      SELECT id FROM profiles
      WHERE firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

-- Habit logs: same pattern
CREATE POLICY "habit_logs_own" ON habit_logs
  FOR ALL USING (
    user_id = (
      SELECT id FROM profiles
      WHERE firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

-- Weekly insights: same pattern
CREATE POLICY "weekly_insights_own" ON weekly_insights
  FOR ALL USING (
    user_id = (
      SELECT id FROM profiles
      WHERE firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

-- Helper function to get current profile id
CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles
  WHERE firebase_uid = (current_setting('request.jwt.claims', true)::json->>'sub')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
