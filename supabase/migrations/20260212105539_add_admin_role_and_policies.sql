/*
  # Add Admin Role and Policies

  1. Modified Tables
    - `user_profiles` - Added `is_admin` boolean column (default false)

  2. Security
    - Admin users can read ALL rows in: user_profiles, programs, program_participants,
      program_applications, kit_codes, kit_orders, order_status_updates, plants, care_logs,
      invites, kit_verifications
    - Admin users can update: kit_orders (payment/delivery status), user_profiles (admin flag),
      programs (status), order_status_updates (insert)
    - Admin check uses: (SELECT is_admin FROM user_profiles WHERE id = auth.uid())

  3. Important Notes
    - is_admin defaults to false so no existing users gain access
    - You must manually set is_admin = true for your admin user via SQL
    - Policies are additive - existing user policies remain intact
    - Admin policies allow full platform oversight without breaking per-user access
*/

-- Add is_admin column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM user_profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Admin SELECT policies for all key tables

CREATE POLICY "Admins can read all user profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update user profiles"
  ON user_profiles FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can read all programs"
  ON programs FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all programs"
  ON programs FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can read all participants"
  ON program_participants FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can read all applications"
  ON program_applications FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can read all kit codes"
  ON kit_codes FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can read all kit orders"
  ON kit_orders FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update kit orders"
  ON kit_orders FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can read all order status updates"
  ON order_status_updates FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert order status updates"
  ON order_status_updates FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can read all plants"
  ON plants FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can read all care logs"
  ON care_logs FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can read all invites"
  ON invites FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can read all kit verifications"
  ON kit_verifications FOR SELECT TO authenticated
  USING (is_admin());

-- Index for admin lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin) WHERE is_admin = true;
