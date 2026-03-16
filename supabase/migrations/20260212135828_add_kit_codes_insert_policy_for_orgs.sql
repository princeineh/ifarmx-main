/*
  # Add kit_codes INSERT policy for organizations

  1. Security Changes
    - Add INSERT policy on `kit_codes` allowing organization users to create kit codes
      for programs they own
    - Add UPDATE policy allowing organizations to update kit codes they created
      (for assignment purposes)

  2. Notes
    - Organizations need to generate kit codes when assigning kits to participants
    - The policy checks that the program belongs to the inserting user
*/

CREATE POLICY "Org users can insert kit codes for their programs"
  ON kit_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = kit_codes.program_id
      AND programs.org_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update codes they're activating" ON public.kit_codes;
CREATE POLICY "Users can update codes they are activating or orgs assigning"
  ON public.kit_codes FOR UPDATE
  TO authenticated
  USING (
    used = false
    OR user_id = (SELECT auth.uid())
    OR assigned_by_org_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = kit_codes.program_id
      AND programs.org_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR assigned_by_org_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = kit_codes.program_id
      AND programs.org_user_id = (SELECT auth.uid())
    )
  );
