/*
  # Add admin insert policy for program participants

  1. Changes
    - Add INSERT policy for admins on program_participants table
    - Allows admins to assign any user to any program

  2. Security
    - Only admins can use this policy
    - Admins are verified via is_admin() helper function
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'program_participants'
    AND policyname = 'Admins can insert any participant'
  ) THEN
    CREATE POLICY "Admins can insert any participant"
      ON program_participants
      FOR INSERT
      TO authenticated
      WITH CHECK (is_admin());
  END IF;
END $$;