/*
  # Add Appreciations and Notifications System (v2)

  1. New Tables
    - `appreciations` - for org users to send rewards/appreciation to participants
      - Tracks badge type, period, email status, read status
    - `notifications` - general notification system (may already exist, handled safely)

  2. Security
    - RLS on all tables with ownership-based policies
    - Orgs can send appreciations for their programs
    - Recipients can view and mark as read
*/

-- Appreciations table
CREATE TABLE IF NOT EXISTS appreciations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  recipient_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  badge_type text NOT NULL DEFAULT 'special',
  period_type text NOT NULL DEFAULT 'weekly',
  period_label text NOT NULL DEFAULT '',
  email_sent boolean NOT NULL DEFAULT false,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appreciations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org users can insert appreciations for their programs" ON appreciations;
CREATE POLICY "Org users can insert appreciations for their programs"
  ON appreciations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = appreciations.program_id
      AND programs.org_user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

DROP POLICY IF EXISTS "Org users can view appreciations they sent" ON appreciations;
CREATE POLICY "Org users can view appreciations they sent"
  ON appreciations FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Recipients can view their appreciations" ON appreciations;
CREATE POLICY "Recipients can view their appreciations"
  ON appreciations FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Recipients can mark appreciations as read" ON appreciations;
CREATE POLICY "Recipients can mark appreciations as read"
  ON appreciations FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  link_type text,
  link_id text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Org and system can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.user_type = 'organization' OR user_profiles.is_admin = true)
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appreciations_program_id ON appreciations(program_id);
CREATE INDEX IF NOT EXISTS idx_appreciations_recipient_id ON appreciations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_appreciations_sender_id ON appreciations(sender_id);
CREATE INDEX IF NOT EXISTS idx_appreciations_created_at ON appreciations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
