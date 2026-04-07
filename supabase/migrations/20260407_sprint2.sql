-- Sprint 2: Subscription, quiet hours, habit archiving, and notifications

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiet_hours_start TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiet_hours_end TEXT;

ALTER TABLE habits ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
