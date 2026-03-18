-- The previous migration queried family_invites directly from a farming_groups
-- SELECT policy. But family_invites has its own policy that queries farming_groups
-- back → infinite recursion. Fix by wrapping in a SECURITY DEFINER function.

DROP POLICY IF EXISTS "Anyone can preview a group with a valid active invite" ON farming_groups;

CREATE OR REPLACE FUNCTION farming_group_has_active_invite(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_invites
    WHERE group_id = p_group_id
      AND used_by_user_id IS NULL
      AND expires_at > now()
  );
$$;

CREATE POLICY "Anyone can preview a group with a valid active invite"
  ON farming_groups FOR SELECT
  TO authenticated
  USING (farming_group_has_active_invite(id));
