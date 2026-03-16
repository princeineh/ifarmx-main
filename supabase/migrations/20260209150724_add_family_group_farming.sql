/*
  # Add Family and Group Farming Support

  1. New Tables
    - `farming_groups`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles) - Group leader/creator
      - `kit_code_id` (uuid, references kit_codes) - Associated kit
      - `group_type` (text) - 'family' or 'group'
      - `group_name` (text) - Name of the family/group
      - `total_seeds` (integer) - Total seeds to allocate
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `group_members`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references farming_groups)
      - `name` (text) - Member name
      - `relationship` (text) - e.g., 'spouse', 'child', 'sibling', 'friend'
      - `seeds_allocated` (integer) - Number of seeds allocated to this member
      - `phone` (text, optional) - Contact information
      - `created_at` (timestamptz)

  2. Table Updates
    - Add `farming_type` column to plants table ('individual', 'family', 'group')
    - Add `farming_group_id` column to plants table

  3. Security
    - Enable RLS on all new tables
    - Add policies for users to manage their own groups and members

  4. Notes
    - Family and group farming both use 'family' as the underlying type
    - Groups allow users to allocate their seeds among family members or group participants
*/

-- Create farming_groups table
CREATE TABLE IF NOT EXISTS farming_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  kit_code_id uuid REFERENCES kit_codes(id) ON DELETE SET NULL,
  group_type text NOT NULL CHECK (group_type IN ('family', 'group')),
  group_name text NOT NULL,
  total_seeds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES farming_groups(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  relationship text,
  seeds_allocated integer DEFAULT 0,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Add farming type columns to plants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants' AND column_name = 'farming_type'
  ) THEN
    ALTER TABLE plants ADD COLUMN farming_type text DEFAULT 'individual' CHECK (farming_type IN ('individual', 'family', 'group'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants' AND column_name = 'farming_group_id'
  ) THEN
    ALTER TABLE plants ADD COLUMN farming_group_id uuid REFERENCES farming_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE farming_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Policies for farming_groups
CREATE POLICY "Users can view own farming groups"
  ON farming_groups FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own farming groups"
  ON farming_groups FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own farming groups"
  ON farming_groups FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own farming groups"
  ON farming_groups FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Organization users can view groups for their programs"
  ON farming_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kit_codes kc
      JOIN programs p ON p.id = kc.program_id
      WHERE kc.id = farming_groups.kit_code_id
      AND p.org_user_id = auth.uid()
    )
  );

-- Policies for group_members
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farming_groups fg
      WHERE fg.id = group_members.group_id
      AND fg.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add members to their groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farming_groups fg
      WHERE fg.id = group_members.group_id
      AND fg.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update members of their groups"
  ON group_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farming_groups fg
      WHERE fg.id = group_members.group_id
      AND fg.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farming_groups fg
      WHERE fg.id = group_members.group_id
      AND fg.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete members from their groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farming_groups fg
      WHERE fg.id = group_members.group_id
      AND fg.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization users can view group members for their programs"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farming_groups fg
      JOIN kit_codes kc ON kc.id = fg.kit_code_id
      JOIN programs p ON p.id = kc.program_id
      WHERE fg.id = group_members.group_id
      AND p.org_user_id = auth.uid()
    )
  );