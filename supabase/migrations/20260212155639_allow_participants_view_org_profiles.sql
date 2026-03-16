/*
  # Allow participants to view org user profiles

  1. Changes
    - Add SELECT policy on `user_profiles` for participants to see the 
      profile of org users whose programs they are enrolled in
    - This enables participants to see who sent them an appreciation

  2. Security
    - Only allows viewing profiles of org users for programs the 
      participant is actively enrolled in
    - Authenticated users only
*/

CREATE POLICY "Participants can view program org profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_participants pp
      JOIN programs p ON p.id = pp.program_id
      WHERE pp.user_id = auth.uid()
      AND p.org_user_id = user_profiles.id
    )
  );
