/*
  # Allow organizations to insert program participants

  1. Security Changes
    - Add INSERT policy on `program_participants` allowing organization users
      to add participants to programs they own
    - This fixes the issue where accepting applications silently failed
      because the org user_id didn't match the participant user_id

  2. Notes
    - The existing policy only allowed self-insertion (user_id = auth.uid())
    - Organizations need to insert participants on behalf of accepted applicants
*/

CREATE POLICY "Org users can insert participants for own programs"
  ON program_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_participants.program_id
      AND programs.org_user_id = (SELECT auth.uid())
    )
  );
