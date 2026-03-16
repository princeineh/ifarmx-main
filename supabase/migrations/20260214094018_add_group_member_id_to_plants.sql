/*
  # Link plants to specific group members

  1. Modified Tables
    - `plants`
      - Added `group_member_id` (uuid, nullable, FK to group_members.id)
      - When a group member is deleted, the reference is set to NULL
      - Index added for efficient lookups

  2. Notes
    - This enables accurate per-member kit counts by querying actual plants
    - Care logs are already per-plant, so per-member logs work automatically
    - Existing plants without member assignment remain NULL
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants' AND column_name = 'group_member_id'
  ) THEN
    ALTER TABLE plants ADD COLUMN group_member_id uuid REFERENCES group_members(id) ON DELETE SET NULL;
    CREATE INDEX idx_plants_group_member_id ON plants(group_member_id);
  END IF;
END $$;
