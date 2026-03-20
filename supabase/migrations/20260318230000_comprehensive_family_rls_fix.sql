-- ══════════════════════════════════════════════════════════════════════════════
-- COMPREHENSIVE FAMILY GROUP FIX
-- Run this ONCE in the Supabase SQL editor.
-- Safe to re-run (uses CREATE OR REPLACE + DROP IF EXISTS + IF NOT EXISTS).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Step 1: Ensure all schema columns exist ───────────────────────────────────

-- invite_id on family_join_requests (migration 210000 may not have been applied)
ALTER TABLE family_join_requests
  ADD COLUMN IF NOT EXISTS invite_id uuid REFERENCES family_invites(id) ON DELETE SET NULL;

-- updated_at on family_join_requests
ALTER TABLE family_join_requests
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- monitor_member_id on group_members (migration 200000 may not have been applied)
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS monitor_member_id uuid REFERENCES group_members(id) ON DELETE SET NULL;

-- last_seen_at on user_profiles (migration 150000 may not have been applied)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- ── Step 2: SECURITY DEFINER helper functions ─────────────────────────────────

-- Checks if current user is the head OR original owner of a group.
-- SECURITY DEFINER so it can be called safely from RLS policies without recursion.
CREATE OR REPLACE FUNCTION auth_user_is_group_head(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM farming_groups
    WHERE id = p_group_id
      AND (head_user_id = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  );
$$;

-- Returns all group_ids where current user is a linked member.
CREATE OR REPLACE FUNCTION auth_user_farming_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT group_id FROM group_members WHERE linked_user_id = (SELECT auth.uid());
$$;

-- Checks if current user is a linked member of a specific group.
CREATE OR REPLACE FUNCTION auth_user_is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND linked_user_id = (SELECT auth.uid())
  );
$$;

-- Checks if two users share any group (for presence/profile visibility).
CREATE OR REPLACE FUNCTION auth_user_shares_group_with(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2
      ON gm2.group_id = gm1.group_id
     AND gm2.linked_user_id = (SELECT auth.uid())
    WHERE gm1.linked_user_id = p_user_id
  );
$$;

-- Checks if a group has an active (unused, non-expired) invite.
CREATE OR REPLACE FUNCTION farming_group_has_active_invite(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_invites
    WHERE group_id = p_group_id
      AND used_by_user_id IS NULL
      AND expires_at > now()
  );
$$;

-- Returns pending join requests for current user with group names (bypasses RLS).
CREATE OR REPLACE FUNCTION get_user_pending_requests()
RETURNS TABLE(group_id uuid, group_name text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT fjr.group_id, fg.group_name, fjr.created_at
  FROM family_join_requests fjr
  JOIN farming_groups fg ON fg.id = fjr.group_id
  WHERE fjr.requester_user_id = (SELECT auth.uid())
    AND fjr.status = 'pending';
$$;

-- Returns group preview for an invite code (for join flow).
CREATE OR REPLACE FUNCTION get_group_preview_from_invite(p_code text)
RETURNS TABLE(group_id uuid, group_name text, group_type text, member_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
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

-- ── Step 3: farming_groups policies ───────────────────────────────────────────

-- Fix UPDATE: allow both user_id AND head_user_id to update the group
DROP POLICY IF EXISTS "Users can update own farming groups" ON farming_groups;
DROP POLICY IF EXISTS "Head or owner can update farming groups" ON farming_groups;
CREATE POLICY "Head or owner can update farming groups"
  ON farming_groups FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR head_user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR head_user_id = auth.uid());

-- Fix SELECT: head_user_id + linked members (replace older recursive policies)
DROP POLICY IF EXISTS "Head and linked members can view their group" ON farming_groups;
CREATE POLICY "Head and linked members can view their group"
  ON farming_groups FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR head_user_id = auth.uid()
    OR auth_user_is_group_member(id)
  );

-- Fix preview: anyone can see a group with an active invite (for join flow)
DROP POLICY IF EXISTS "Anyone can preview a group with a valid active invite" ON farming_groups;
CREATE POLICY "Anyone can preview a group with a valid active invite"
  ON farming_groups FOR SELECT
  TO authenticated
  USING (farming_group_has_active_invite(id));

-- ── Step 4: group_members policies ────────────────────────────────────────────

-- SELECT: head OR linked member can see all members in the group
DROP POLICY IF EXISTS "Linked members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Head can view all members of their groups" ON group_members;
CREATE POLICY "Head and linked members can view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    auth_user_is_group_head(group_id)
    OR linked_user_id = auth.uid()
    OR auth_user_is_group_member(group_id)
  );

-- INSERT: head (user_id OR head_user_id) can add members
DROP POLICY IF EXISTS "Users can add members to their groups" ON group_members;
DROP POLICY IF EXISTS "Users can join a group via valid invite" ON group_members;
DROP POLICY IF EXISTS "Head can insert approved members" ON group_members;
CREATE POLICY "Head can insert group members"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_is_group_head(group_id));

-- UPDATE: head can update member data (relationship, monitor_member_id, etc.)
DROP POLICY IF EXISTS "Users can update members of their groups" ON group_members;
DROP POLICY IF EXISTS "Head can update members in their groups" ON group_members;
DROP POLICY IF EXISTS "Head can update group members" ON group_members;
CREATE POLICY "Head can update group members"
  ON group_members FOR UPDATE
  TO authenticated
  USING (auth_user_is_group_head(group_id));

-- DELETE: head can remove members
DROP POLICY IF EXISTS "Users can delete members from their groups" ON group_members;
DROP POLICY IF EXISTS "Head can remove members" ON group_members;
CREATE POLICY "Head can delete group members"
  ON group_members FOR DELETE
  TO authenticated
  USING (auth_user_is_group_head(group_id));

-- ── Step 5: family_invites policies ───────────────────────────────────────────

-- Ensure head can manage all invites (create, view, update when approving)
DROP POLICY IF EXISTS "Head can manage own group invites" ON family_invites;
CREATE POLICY "Head can manage own group invites"
  ON family_invites FOR ALL
  TO authenticated
  USING (auth_user_is_group_head(group_id))
  WITH CHECK (auth_user_is_group_head(group_id));

-- Anyone can look up an invite code (needed for join preview)
DROP POLICY IF EXISTS "Authenticated users can look up invite codes" ON family_invites;
CREATE POLICY "Authenticated users can look up invite codes"
  ON family_invites FOR SELECT
  TO authenticated
  USING (true);

-- Remove the old "Invited user can claim" policy (head now handles this on approval)
DROP POLICY IF EXISTS "Invited user can claim their invite" ON family_invites;

-- ── Step 6: family_join_requests policies ─────────────────────────────────────

-- Users can submit and view their own requests
DROP POLICY IF EXISTS "Users can submit join requests" ON family_join_requests;
CREATE POLICY "Users can submit join requests"
  ON family_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (requester_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own join requests" ON family_join_requests;
CREATE POLICY "Users can view own join requests"
  ON family_join_requests FOR SELECT
  TO authenticated
  USING (requester_user_id = auth.uid());

-- Head can manage all requests for their groups
DROP POLICY IF EXISTS "Head can manage join requests for their group" ON family_join_requests;
CREATE POLICY "Head can manage join requests for their group"
  ON family_join_requests FOR ALL
  TO authenticated
  USING (auth_user_is_group_head(group_id))
  WITH CHECK (auth_user_is_group_head(group_id));

-- ── Step 7: family_messages policies ──────────────────────────────────────────

DROP POLICY IF EXISTS "Head and linked members can read messages" ON family_messages;
CREATE POLICY "Head and linked members can read messages"
  ON family_messages FOR SELECT
  TO authenticated
  USING (
    auth_user_is_group_head(group_id)
    OR auth_user_is_group_member(group_id)
  );

DROP POLICY IF EXISTS "Head and linked members can send messages" ON family_messages;
CREATE POLICY "Head and linked members can send messages"
  ON family_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND (
      auth_user_is_group_head(group_id)
      OR auth_user_is_group_member(group_id)
    )
  );

-- ── Step 8: plants — group members can view all plants in their group ─────────

DROP POLICY IF EXISTS "Group members can view all plants in their group" ON plants;
CREATE POLICY "Group members can view all plants in their group"
  ON plants FOR SELECT
  TO authenticated
  USING (
    farming_group_id IS NOT NULL
    AND farming_group_id IN (SELECT auth_user_farming_group_ids())
  );

-- ── Step 9: user_profiles — members can see each other's presence + avatar ────

DROP POLICY IF EXISTS "Linked members can see each other's last_seen" ON user_profiles;
CREATE POLICY "Linked members can see each other's presence"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR auth_user_shares_group_with(id)
  );
