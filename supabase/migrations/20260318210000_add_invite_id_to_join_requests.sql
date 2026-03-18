-- Track which invite code triggered a join request so the head can
-- mark it as used when approving (rather than auto-consuming it on submit).

ALTER TABLE family_join_requests
  ADD COLUMN IF NOT EXISTS invite_id uuid REFERENCES family_invites(id) ON DELETE SET NULL;
