-- Allow any group member to be assigned as a monitor for a dependent (custodian child).
-- The monitor is responsible for following up on the dependent's daily plant care.

ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS monitor_member_id uuid REFERENCES group_members(id) ON DELETE SET NULL;

COMMENT ON COLUMN group_members.monitor_member_id IS
  'The group_members.id of the member assigned to monitor this dependent. NULL means the group head is responsible.';
