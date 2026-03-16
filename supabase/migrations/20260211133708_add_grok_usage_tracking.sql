/*
  # Add Grok AI Usage Tracking

  1. New Tables
    - `grok_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `messages_count` (integer) - number of messages sent today
      - `last_reset_date` (date) - date when counter was last reset
      - `total_messages` (integer) - lifetime message count
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `grok_usage` table
    - Add policy for authenticated users to read their own usage data
    - Add policy for authenticated users to update their own usage data

  3. Notes
    - Daily limit set to 50 messages per user
    - Counter resets automatically at midnight
    - Tracks both daily and lifetime usage
*/

CREATE TABLE IF NOT EXISTS grok_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages_count integer DEFAULT 0 NOT NULL,
  last_reset_date date DEFAULT CURRENT_DATE NOT NULL,
  total_messages integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE grok_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage data"
  ON grok_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage data"
  ON grok_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage data"
  ON grok_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_grok_usage_user_id ON grok_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_grok_usage_last_reset_date ON grok_usage(last_reset_date);
