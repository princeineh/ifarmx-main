/*
  # Add order approval workflow and program link

  1. Modified Tables
    - `kit_orders`
      - `program_id` (uuid, nullable) - Links org orders to their program
      - `admin_approved` (boolean, default false) - Whether admin has approved (for org orders)
      - `approved_at` (timestamptz, nullable) - When the admin approved the order

  2. Important Notes
    - Individual/family orders: activation codes are auto-generated when admin marks delivery as "delivered"
    - Organization orders: admin must approve after verifying payment and reviewing the plan
    - program_id allows the system to link generated kit codes to the correct program
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kit_orders' AND column_name = 'program_id'
  ) THEN
    ALTER TABLE kit_orders ADD COLUMN program_id uuid REFERENCES programs(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kit_orders' AND column_name = 'admin_approved'
  ) THEN
    ALTER TABLE kit_orders ADD COLUMN admin_approved boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kit_orders' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE kit_orders ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kit_orders_program_id ON kit_orders(program_id);
CREATE INDEX IF NOT EXISTS idx_kit_orders_admin_approved ON kit_orders(admin_approved);
