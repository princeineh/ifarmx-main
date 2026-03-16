/*
  # Gudbud Fame - Oil Palm Tracking Database Schema

  ## Overview
  Complete database schema for the Gudbud Fame palm oil tracking application.
  Supports individual and organizational users, kit activation, plant tracking,
  care logs, and organizational program management.

  ## New Tables
  
  ### 1. user_profiles
  Extended user profile information
  - `id` (uuid, FK to auth.users)
  - `user_type` (text) - 'individual' or 'organization'
  - `favorite_dish` (text) - User's favorite Nigerian dish
  - `region_vibe` (text) - User's cultural region preference
  - `display_name` (text) - User's display name
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. kit_codes
  Unique kit activation codes
  - `id` (uuid, primary key)
  - `code` (text, unique) - The unique kit code
  - `used` (boolean) - Whether the code has been used
  - `user_id` (uuid, FK to auth.users) - User who activated it
  - `program_id` (uuid, FK to programs) - Optional program link
  - `activated_at` (timestamptz) - When it was activated
  - `created_at` (timestamptz)

  ### 3. plants
  Individual plant records
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `kit_code_id` (uuid, FK to kit_codes)
  - `program_id` (uuid, FK to programs) - Optional program link
  - `name` (text) - User-given name for the plant
  - `stage` (text) - Current growth stage
  - `planted_date` (date)
  - `land_volunteer` (boolean) - Enrolled in land volunteer program
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. care_logs
  Daily care log entries
  - `id` (uuid, primary key)
  - `plant_id` (uuid, FK to plants)
  - `user_id` (uuid, FK to auth.users)
  - `log_date` (date)
  - `notes` (text)
  - `photo_url` (text) - Supabase storage URL
  - `watered` (boolean)
  - `fertilized` (boolean)
  - `weeded` (boolean)
  - `pruned` (boolean)
  - `pest_checked` (boolean)
  - `created_at` (timestamptz)

  ### 5. programs
  Organizational programs
  - `id` (uuid, primary key)
  - `org_user_id` (uuid, FK to auth.users)
  - `name` (text)
  - `description` (text)
  - `target_participants` (integer)
  - `start_date` (date)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. invites
  Program invitation codes
  - `id` (uuid, primary key)
  - `program_id` (uuid, FK to programs)
  - `code` (text, unique)
  - `email` (text) - Optional email invite
  - `expires_at` (timestamptz)
  - `used` (boolean)
  - `used_by` (uuid, FK to auth.users)
  - `created_at` (timestamptz)

  ### 7. program_participants
  Links users to programs
  - `id` (uuid, primary key)
  - `program_id` (uuid, FK to programs)
  - `user_id` (uuid, FK to auth.users)
  - `joined_at` (timestamptz)
  - `status` (text) - 'active', 'inactive'

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Organization users can access their program participants' data
  - Comprehensive policies for read/write operations
*/

-- User profiles extension
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL DEFAULT 'individual' CHECK (user_type IN ('individual', 'organization')),
  favorite_dish text,
  region_vibe text,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Kit codes table
CREATE TABLE IF NOT EXISTS kit_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  used boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  program_id uuid,
  activated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kit_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check if code exists"
  ON kit_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update codes they're activating"
  ON kit_codes FOR UPDATE
  TO authenticated
  USING (used = false OR user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  target_participants integer DEFAULT 0,
  start_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org users can view own programs"
  ON programs FOR SELECT
  TO authenticated
  USING (org_user_id = auth.uid());

CREATE POLICY "Org users can insert own programs"
  ON programs FOR INSERT
  TO authenticated
  WITH CHECK (org_user_id = auth.uid());

CREATE POLICY "Org users can update own programs"
  ON programs FOR UPDATE
  TO authenticated
  USING (org_user_id = auth.uid())
  WITH CHECK (org_user_id = auth.uid());

CREATE POLICY "Org users can delete own programs"
  ON programs FOR DELETE
  TO authenticated
  USING (org_user_id = auth.uid());

-- Add foreign key constraint to kit_codes now that programs table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'kit_codes_program_id_fkey'
  ) THEN
    ALTER TABLE kit_codes
    ADD CONSTRAINT kit_codes_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Plants table
CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kit_code_id uuid REFERENCES kit_codes(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE SET NULL,
  name text NOT NULL,
  stage text DEFAULT 'nursery' CHECK (stage IN ('nursery', 'transplant', 'flowering', 'fruiting', 'harvest')),
  planted_date date DEFAULT CURRENT_DATE,
  land_volunteer boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plants"
  ON plants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Org users can view program participants' plants"
  ON plants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = plants.program_id
      AND p.org_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plants"
  ON plants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own plants"
  ON plants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own plants"
  ON plants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Care logs table
CREATE TABLE IF NOT EXISTS care_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date DEFAULT CURRENT_DATE,
  notes text,
  photo_url text,
  watered boolean DEFAULT false,
  fertilized boolean DEFAULT false,
  weeded boolean DEFAULT false,
  pruned boolean DEFAULT false,
  pest_checked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own care logs"
  ON care_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Org users can view program participants' care logs"
  ON care_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plants p
      JOIN programs pr ON p.program_id = pr.id
      WHERE p.id = care_logs.plant_id
      AND pr.org_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own care logs"
  ON care_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own care logs"
  ON care_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own care logs"
  ON care_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  email text,
  expires_at timestamptz,
  used boolean DEFAULT false,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view valid invites"
  ON invites FOR SELECT
  TO authenticated
  USING (NOT used AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Org users can create invites for own programs"
  ON invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = invites.program_id
      AND programs.org_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invites they're using"
  ON invites FOR UPDATE
  TO authenticated
  USING (NOT used OR used_by = auth.uid())
  WITH CHECK (used_by = auth.uid());

-- Program participants table
CREATE TABLE IF NOT EXISTS program_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  UNIQUE(program_id, user_id)
);

ALTER TABLE program_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own participations"
  ON program_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Org users can view own program participants"
  ON program_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_participants.program_id
      AND programs.org_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own participations"
  ON program_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Org users can update own program participants"
  ON program_participants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_participants.program_id
      AND programs.org_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_participants.program_id
      AND programs.org_user_id = auth.uid()
    )
  );

-- Create storage bucket for care log photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('care-photos', 'care-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for care photos
CREATE POLICY "Users can upload own care photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'care-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view care photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'care-photos');

CREATE POLICY "Users can update own care photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'care-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own care photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'care-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kit_codes_code ON kit_codes(code);
CREATE INDEX IF NOT EXISTS idx_kit_codes_user_id ON kit_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_program_id ON plants(program_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_plant_id ON care_logs(plant_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_user_id ON care_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_log_date ON care_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_programs_org_user_id ON programs(org_user_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_program_id ON program_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_user_id ON program_participants(user_id);
