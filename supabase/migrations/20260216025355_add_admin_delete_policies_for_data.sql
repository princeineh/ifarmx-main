/*
  # Add admin delete policies

  1. Changes
    - Add DELETE policy for admins on reservations table
    - Add DELETE policy for admins on programs table (check if needed)
    - Add DELETE policy for admins on user_profiles table (check if needed)

  2. Security
    - Only admins can delete records
    - Admins are verified via is_admin() helper function
*/

-- Add admin delete policy for reservations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reservations'
    AND policyname = 'Admins can delete reservations'
  ) THEN
    CREATE POLICY "Admins can delete reservations"
      ON reservations
      FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- Add admin delete policy for programs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'programs'
    AND policyname = 'Admins can delete any program'
  ) THEN
    CREATE POLICY "Admins can delete any program"
      ON programs
      FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;