/*
  # Add remaining RLS policies for program applications

  1. Security
    - Org owners can view applications for their programs
    - Users can apply to published open programs
    - Org owners can update application status
    - All authenticated users can view published programs
  
  2. Indexes
    - program_applications by program_id, user_id, status
    - programs by status
    - user_profiles by state_of_origin
*/

-- Drop existing policies first to avoid conflicts, then recreate
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Org owners can view program applications' AND tablename = 'program_applications') THEN
    DROP POLICY "Org owners can view program applications" ON program_applications;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can apply to published programs' AND tablename = 'program_applications') THEN
    DROP POLICY "Users can apply to published programs" ON program_applications;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Org owners can update applications' AND tablename = 'program_applications') THEN
    DROP POLICY "Org owners can update applications" ON program_applications;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view published programs' AND tablename = 'programs') THEN
    DROP POLICY "Anyone can view published programs" ON programs;
  END IF;
END $$;

CREATE POLICY "Org owners can view program applications"
  ON program_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_applications.program_id
      AND programs.org_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can apply to published programs"
  ON program_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_applications.program_id
      AND programs.status = 'published'
      AND programs.acceptance_type = 'open'
    )
  );

CREATE POLICY "Org owners can update applications"
  ON program_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_applications.program_id
      AND programs.org_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_applications.program_id
      AND programs.org_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view published programs"
  ON programs
  FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE INDEX IF NOT EXISTS idx_program_applications_program_id ON program_applications(program_id);
CREATE INDEX IF NOT EXISTS idx_program_applications_user_id ON program_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_program_applications_status ON program_applications(status);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state ON user_profiles(state_of_origin);
