/*
  # Allow orgs to view applicant farming stats for selection decisions

  1. Changes
    - Add SELECT policy on `plants` allowing org users to view all plants 
      of users who have applied to their programs
    - Add SELECT policy on `care_logs` for those plants
    - Add SELECT policy on `program_participants` allowing org users to 
      see enrollment count of their applicants across all programs

  2. Security
    - Only grants access when the viewed user has an active application 
      to the org's own program
    - Authenticated users only
    - Read-only access

  3. Notes
    - Enables orgs to make informed selection decisions by seeing 
      applicant farming history
*/

CREATE POLICY "Orgs can view applicant plants for selection"
  ON plants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_applications pa
      JOIN programs p ON p.id = pa.program_id
      WHERE pa.user_id = plants.user_id
      AND p.org_user_id = auth.uid()
      AND pa.status = 'pending'
    )
  );

CREATE POLICY "Orgs can view applicant care logs for selection"
  ON care_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plants pl
      JOIN program_applications pa ON pa.user_id = pl.user_id
      JOIN programs p ON p.id = pa.program_id
      WHERE pl.id = care_logs.plant_id
      AND p.org_user_id = auth.uid()
      AND pa.status = 'pending'
    )
  );

CREATE POLICY "Orgs can view applicant program enrollments for selection"
  ON program_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_applications pa
      JOIN programs p ON p.id = pa.program_id
      WHERE pa.user_id = program_participants.user_id
      AND p.org_user_id = auth.uid()
      AND pa.status = 'pending'
    )
  );
