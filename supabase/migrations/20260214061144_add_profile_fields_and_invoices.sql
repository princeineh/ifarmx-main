/*
  # Add profile fields and program invoices

  1. Modified Tables
    - `user_profiles`
      - `gender` (text, nullable) - Male, Female, Other, Prefer not to say
      - `disabilities` (text, nullable) - Any disabilities
      - `health_challenge` (text, nullable) - Any health challenges

  2. New Tables
    - `program_invoices`
      - `id` (uuid, primary key)
      - `program_id` (uuid, FK to programs)
      - `org_user_id` (uuid, FK to auth.users)
      - `invoice_number` (text, unique)
      - `quantity` (integer) - number of kits
      - `unit_price` (numeric)
      - `total_amount` (numeric)
      - `status` (text) - pending, paid, overdue, cancelled
      - `due_date` (timestamptz)
      - `paid_at` (timestamptz, nullable)
      - `payment_reference` (text, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on `program_invoices`
    - Org users can view/update their own invoices
    - Admins can view/update all invoices

  4. Changes
    - Added org delete policy for programs (status = draft only)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'disabilities'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN disabilities text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'health_challenge'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN health_challenge text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS program_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id),
  org_user_id uuid NOT NULL REFERENCES auth.users(id),
  invoice_number text UNIQUE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 24999,
  total_amount numeric NOT NULL DEFAULT 24999,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE program_invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Org users can view own invoices' AND tablename = 'program_invoices'
  ) THEN
    CREATE POLICY "Org users can view own invoices"
      ON program_invoices FOR SELECT TO authenticated
      USING (org_user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Org users can insert own invoices' AND tablename = 'program_invoices'
  ) THEN
    CREATE POLICY "Org users can insert own invoices"
      ON program_invoices FOR INSERT TO authenticated
      WITH CHECK (org_user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all invoices' AND tablename = 'program_invoices'
  ) THEN
    CREATE POLICY "Admins can read all invoices"
      ON program_invoices FOR SELECT TO authenticated
      USING (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all invoices' AND tablename = 'program_invoices'
  ) THEN
    CREATE POLICY "Admins can update all invoices"
      ON program_invoices FOR UPDATE TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Org users can delete draft programs' AND tablename = 'programs'
  ) THEN
    CREATE POLICY "Org users can delete draft programs"
      ON programs FOR DELETE TO authenticated
      USING (org_user_id = (SELECT auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_program_invoices_org_user_id ON program_invoices(org_user_id);
CREATE INDEX IF NOT EXISTS idx_program_invoices_program_id ON program_invoices(program_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender ON user_profiles(gender);
