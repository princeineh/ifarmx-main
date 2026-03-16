/*
  # Allow organizations to view participant profiles

  1. Security Changes
    - Update the "Org owners can view applicant profiles" policy on `user_profiles`
      to also cover users who are program participants (not just applicants)
    - This fixes the Participant Monitor showing zero results because the org
      couldn't read participant profile data through RLS

  2. Notes
    - The old policy only checked program_applications
    - The new policy checks both program_applications AND program_participants
*/

DROP POLICY IF EXISTS "Org owners can view applicant profiles" ON user_profiles;

CREATE POLICY "Org owners can view applicant and participant profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM program_applications pa
      JOIN programs p ON p.id = pa.program_id
      WHERE pa.user_id = user_profiles.id
      AND p.org_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM program_participants pp
      JOIN programs p ON p.id = pp.program_id
      WHERE pp.user_id = user_profiles.id
      AND p.org_user_id = auth.uid()
    )
  );
