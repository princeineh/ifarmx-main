-- Allow any authenticated user to SELECT a farming_group row if there is
-- an active (unclaimed, unexpired) invite for that group.
-- This makes the group name visible during the invite lookup step,
-- even before the user has joined (and without needing the RPC).

CREATE POLICY "Anyone can preview a group with a valid active invite"
  ON farming_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_invites fi
      WHERE fi.group_id = farming_groups.id
        AND fi.used_by_user_id IS NULL
        AND fi.expires_at > now()
    )
  );
