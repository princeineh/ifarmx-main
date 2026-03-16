/*
  # Add Reservations Table and Tour Tracking

  1. New Tables
    - `reservations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `phone` (text)
      - `email` (text)
      - `kit_count` (text) - "1", "2-5", "5+"
      - `future_interests` (text array) - fishery, poultry, cash_crops
      - `batch` (integer, default 1)
      - `status` (text, default 'reserved')
      - `created_at` (timestamptz)

  2. Modified Tables
    - `user_profiles` - add `tour_completed` boolean column

  3. Security
    - Enable RLS on `reservations`
    - Users can read and insert their own reservations
*/

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  kit_count text NOT NULL DEFAULT '1',
  future_interests text[] DEFAULT '{}',
  batch integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'reserved',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'tour_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN tour_completed boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_batch ON reservations(batch);
