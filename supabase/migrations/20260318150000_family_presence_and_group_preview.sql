-- ── 1. Fix infinite recursion in farming_groups / group_members RLS ──────────

DROP POLICY IF EXISTS "Head and linked members can view their group" ON farming_groups;
DROP POLICY IF EXISTS "Linked members can view group members" ON group_members;

-- SECURITY DEFINER function: checks membership without triggering RLS on group_members
-- This breaks the recursion cycle between farming_groups ↔ group_members policies
CREATE OR REPLACE FUNCTION auth_user_is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND linked_user_id = (SELECT auth.uid())
  );
$$;

CREATE POLICY "Head and linked members can view their group"
  ON farming_groups FOR SELECT
  TO authenticated
  USING (
    head_user_id = auth.uid()
    OR auth_user_is_group_member(id)
  );

CREATE POLICY "Linked members can view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    linked_user_id = auth.uid()
    OR auth_user_is_group_member(group_id)
  );

-- ── 2. Group preview function for invite code lookup ─────────────────────────
-- Bypasses RLS so a non-member can see the group name + member count
-- before confirming they want to join. Only returns public info.

CREATE OR REPLACE FUNCTION get_group_preview_from_invite(p_code text)
RETURNS TABLE(
  group_id    uuid,
  group_name  text,
  group_type  text,
  member_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    fg.id            AS group_id,
    fg.group_name,
    fg.group_type,
    COUNT(gm.id)     AS member_count
  FROM family_invites fi
  JOIN farming_groups fg ON fg.id = fi.group_id
  LEFT JOIN group_members gm ON gm.group_id = fg.id
  WHERE fi.code = p_code
    AND fi.used_by_user_id IS NULL
    AND fi.expires_at > now()
  GROUP BY fg.id, fg.group_name, fg.group_type;
$$;

-- ── 3. Online / active presence ───────────────────────────────────────────────
-- Add last_seen_at so family members can see who is online

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- SECURITY DEFINER helper: checks if two users share a group (avoids RLS recursion)
CREATE OR REPLACE FUNCTION auth_user_shares_group_with(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2
      ON gm2.group_id = gm1.group_id
     AND gm2.linked_user_id = (SELECT auth.uid())
    WHERE gm1.linked_user_id = p_user_id
  );
$$;

-- Allow linked group-members to read each other's presence (last_seen_at, display_name)
-- The existing "Users can view own profile" policy (id = auth.uid()) still applies
CREATE POLICY "Linked members can see each other's last_seen"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR auth_user_shares_group_with(id)
  );

-- Note: last_seen_at updates are handled by the existing "Users can update own profile" policy
