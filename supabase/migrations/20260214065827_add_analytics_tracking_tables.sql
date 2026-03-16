/*
  # Add analytics tracking tables

  1. New Tables
    - `page_views`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable) - null for anonymous visitors
      - `page` (text) - page identifier e.g. 'dashboard', 'open-programs'
      - `referrer` (text, nullable) - previous page
      - `session_id` (text) - groups views in a single session
      - `user_agent` (text, nullable)
      - `created_at` (timestamptz)

    - `user_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `event_type` (text) - e.g. 'click', 'purchase', 'activate_kit', 'apply_program'
      - `event_data` (jsonb, nullable) - extra metadata about the event
      - `page` (text) - page where event occurred
      - `session_id` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Authenticated users can insert their own analytics
    - Admins can read all analytics data
*/

CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page text NOT NULL,
  referrer text,
  session_id text NOT NULL DEFAULT '',
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb,
  page text NOT NULL DEFAULT '',
  session_id text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert own page views"
  ON page_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all page views"
  ON page_views
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Authenticated users can insert own events"
  ON user_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all events"
  ON user_events
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page ON page_views(page);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at);
