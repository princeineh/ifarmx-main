/*
  # Add join_as, slots, and calculated_amount to reservations

  ## Changes
  - `join_as`: text column indicating the tier the user joined as (individual, family, organisation). Defaults to 'individual'.
  - `slots`: integer column for the number of kit slots reserved. Defaults to 1.
  - `calculated_amount`: numeric column for the live-calculated total amount (slots × ₦24,999). Defaults to 0.

  All three columns are additive — no existing rows are broken.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'join_as'
  ) THEN
    ALTER TABLE reservations ADD COLUMN join_as text NOT NULL DEFAULT 'individual';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'slots'
  ) THEN
    ALTER TABLE reservations ADD COLUMN slots integer NOT NULL DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'calculated_amount'
  ) THEN
    ALTER TABLE reservations ADD COLUMN calculated_amount numeric NOT NULL DEFAULT 0;
  END IF;
END $$;
