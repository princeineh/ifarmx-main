/*
  # Add Kit Verification System

  1. New Tables
    - `kit_items`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the item (e.g., "Seeds", "Fertilizer")
      - `description` (text) - Description of the item
      - `is_required` (boolean) - Whether this item is required
      - `order` (integer) - Display order
      - `created_at` (timestamptz)
    
    - `kit_verifications`
      - `id` (uuid, primary key)
      - `kit_code_id` (uuid, references kit_codes)
      - `user_id` (uuid, references user_profiles)
      - `verified_at` (timestamptz)
      - `all_items_present` (boolean) - Whether all items were present
      - `missing_items` (text[]) - Array of missing item names
      - `notes` (text) - Additional notes from user
      - `alarm_raised` (boolean) - Whether user raised an alarm
      - `created_at` (timestamptz)
    
    - `kit_item_checks`
      - `id` (uuid, primary key)
      - `verification_id` (uuid, references kit_verifications)
      - `kit_item_id` (uuid, references kit_items)
      - `is_present` (boolean) - Whether the item was present
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own verifications
    - Add policies for organization users to view verifications for their programs

  3. Default Data
    - Insert standard kit items
*/

-- Create kit_items table
CREATE TABLE IF NOT EXISTS kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_required boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create kit_verifications table
CREATE TABLE IF NOT EXISTS kit_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_code_id uuid REFERENCES kit_codes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  verified_at timestamptz DEFAULT now(),
  all_items_present boolean DEFAULT false,
  missing_items text[] DEFAULT '{}',
  notes text,
  alarm_raised boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create kit_item_checks table
CREATE TABLE IF NOT EXISTS kit_item_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid REFERENCES kit_verifications(id) ON DELETE CASCADE,
  kit_item_id uuid REFERENCES kit_items(id) ON DELETE CASCADE,
  is_present boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_item_checks ENABLE ROW LEVEL SECURITY;

-- Policies for kit_items (read-only for all authenticated users)
CREATE POLICY "Anyone can view kit items"
  ON kit_items FOR SELECT
  TO authenticated
  USING (true);

-- Policies for kit_verifications
CREATE POLICY "Users can view own verifications"
  ON kit_verifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own verifications"
  ON kit_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own verifications"
  ON kit_verifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organization users can view program verifications"
  ON kit_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kit_codes kc
      JOIN programs p ON p.id = kc.program_id
      WHERE kc.id = kit_verifications.kit_code_id
      AND p.org_user_id = auth.uid()
    )
  );

-- Policies for kit_item_checks
CREATE POLICY "Users can view own item checks"
  ON kit_item_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kit_verifications kv
      WHERE kv.id = kit_item_checks.verification_id
      AND kv.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own item checks"
  ON kit_item_checks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kit_verifications kv
      WHERE kv.id = kit_item_checks.verification_id
      AND kv.user_id = auth.uid()
    )
  );

-- Insert standard kit items
INSERT INTO kit_items (name, description, is_required, display_order) VALUES
  ('Palm Seeds', 'High-quality oil palm seeds', true, 1),
  ('Germination Bag', 'Special bag for seed germination', true, 2),
  ('Organic Fertilizer', 'Nutrient-rich fertilizer for palm trees', true, 3),
  ('Planting Instructions', 'Step-by-step guide for planting', true, 4),
  ('Watering Guide', 'Instructions for proper watering', true, 5),
  ('Growth Chart', 'Track your palm tree growth milestones', false, 6),
  ('Measurement Tape', 'For tracking plant height', false, 7),
  ('Care Calendar', 'Monthly care schedule', false, 8)
ON CONFLICT DO NOTHING;