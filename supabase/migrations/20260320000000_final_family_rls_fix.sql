-- ══════════════════════════════════════════════════════════════════════════════
-- FINAL FAMILY GROUP FIX — Run this in the Supabase SQL Editor.
-- Safe to re-run. Drops ALL old conflicting policies then recreates correctly.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Step 1: Ensure all required columns exist ──────────────────────────────────

ALTER TABLE family_join_requests
  ADD COLUMN IF NOT EXISTS invite_id uuid REFERENCES family_invites(id) ON DELETE SET NULL;

ALTER TABLE family_join_requests
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS monitor_member_id uuid REFERENCES group_members(id) ON DELETE SET NULL;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- ── Step 2: SECURITY DEFINER helper functions ──────────────────────────────────

CREATE OR REPLACE FUNCTION auth_user_is_group_head(p_group_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM farming_groups
    WHERE id = p_group_id
      AND (head_user_id = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_farming_group_ids()
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT group_id FROM group_members WHERE linked_user_id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION auth_user_is_group_member(p_group_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND linked_user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_shares_group_with(p_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm2.group_id = gm1.group_id AND gm2.linked_user_id = (SELECT auth.uid())
    WHERE gm1.linked_user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION farming_group_has_active_invite(p_group_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_invites
    WHERE group_id = p_group_id AND used_by_user_id IS NULL AND expires_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION get_user_pending_requests()
RETURNS TABLE(group_id uuid, group_name text, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT fjr.group_id, fg.group_name, fjr.created_at
  FROM family_join_requests fjr
  JOIN farming_groups fg ON fg.id = fjr.group_id
  WHERE fjr.requester_user_id = (SELECT auth.uid()) AND fjr.status = 'pending';
$$;

CREATE OR REPLACE FUNCTION get_group_preview_from_invite(p_code text)
RETURNS TABLE(group_id uuid, group_name text, group_type text, member_count bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT fg.id AS group_id, fg.group_name, fg.group_type, COUNT(gm.id) AS member_count
  FROM family_invites fi
  JOIN farming_groups fg ON fg.id = fi.group_id
  LEFT JOIN group_members gm ON gm.group_id = fg.id
  WHERE fi.code = p_code AND fi.used_by_user_id IS NULL AND fi.expires_at > now()
  GROUP BY fg.id, fg.group_name, fg.group_type;
$$;

-- ── Step 3: farming_groups policies ───────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own farming groups" ON farming_groups;
DROP POLICY IF EXISTS "Head and linked members can view their group" ON farming_groups;
DROP POLICY IF EXISTS "Anyone can preview a group with a valid active invite" ON farming_groups;
DROP POLICY IF EXISTS "Users can update own farming groups" ON farming_groups;
DROP POLICY IF EXISTS "Head or owner can update farming groups" ON farming_groups;

CREATE POLICY "Head and linked members can view their group"
  ON farming_groups FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR head_user_id = auth.uid() OR auth_user_is_group_member(id));

CREATE POLICY "Anyone can preview a group with a valid active invite"
  ON farming_groups FOR SELECT TO authenticated
  USING (farming_group_has_active_invite(id));

CREATE POLICY "Head or owner can update farming groups"
  ON farming_groups FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR head_user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR head_user_id = auth.uid());

-- ── Step 4: group_members policies ────────────────────────────────────────────

DROP POLICY IF EXISTS "Linked members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Head can view all members of their groups" ON group_members;
DROP POLICY IF EXISTS "Head and linked members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can add members to their groups" ON group_members;
DROP POLICY IF EXISTS "Users can join a group via valid invite" ON group_members;
DROP POLICY IF EXISTS "Head can insert approved members" ON group_members;
DROP POLICY IF EXISTS "Head can insert group members" ON group_members;
DROP POLICY IF EXISTS "Users can update members of their groups" ON group_members;
DROP POLICY IF EXISTS "Head can update members in their groups" ON group_members;
DROP POLICY IF EXISTS "Head can update group members" ON group_members;
DROP POLICY IF EXISTS "Users can delete members from their groups" ON group_members;
DROP POLICY IF EXISTS "Head can remove members" ON group_members;
DROP POLICY IF EXISTS "Head can delete group members" ON group_members;

CREATE POLICY "Head and linked members can view group members"
  ON group_members FOR SELECT TO authenticated
  USING (auth_user_is_group_head(group_id) OR linked_user_id = auth.uid() OR auth_user_is_group_member(group_id));

CREATE POLICY "Head can insert group members"
  ON group_members FOR INSERT TO authenticated
  WITH CHECK (auth_user_is_group_head(group_id));

CREATE POLICY "Head can update group members"
  ON group_members FOR UPDATE TO authenticated
  USING (auth_user_is_group_head(group_id));

CREATE POLICY "Head can delete group members"
  ON group_members FOR DELETE TO authenticated
  USING (auth_user_is_group_head(group_id));

-- ── Step 5: family_invites policies ───────────────────────────────────────────

DROP POLICY IF EXISTS "Head can manage own group invites" ON family_invites;
DROP POLICY IF EXISTS "Authenticated users can look up invite codes" ON family_invites;
DROP POLICY IF EXISTS "Invited user can claim their invite" ON family_invites;

CREATE POLICY "Head can manage own group invites"
  ON family_invites FOR ALL TO authenticated
  USING (auth_user_is_group_head(group_id))
  WITH CHECK (auth_user_is_group_head(group_id));

CREATE POLICY "Authenticated users can look up invite codes"
  ON family_invites FOR SELECT TO authenticated
  USING (true);

-- ── Step 6: family_join_requests policies ─────────────────────────────────────

DROP POLICY IF EXISTS "Users can submit join requests" ON family_join_requests;
DROP POLICY IF EXISTS "Users can view own join requests" ON family_join_requests;
DROP POLICY IF EXISTS "Head can manage join requests for their group" ON family_join_requests;

CREATE POLICY "Users can submit join requests"
  ON family_join_requests FOR INSERT TO authenticated
  WITH CHECK (requester_user_id = auth.uid());

CREATE POLICY "Users can view own join requests"
  ON family_join_requests FOR SELECT TO authenticated
  USING (requester_user_id = auth.uid());

CREATE POLICY "Head can manage join requests for their group"
  ON family_join_requests FOR ALL TO authenticated
  USING (auth_user_is_group_head(group_id))
  WITH CHECK (auth_user_is_group_head(group_id));

-- ── Step 7: family_messages policies ──────────────────────────────────────────

DROP POLICY IF EXISTS "Head and linked members can read messages" ON family_messages;
DROP POLICY IF EXISTS "Head and linked members can send messages" ON family_messages;

CREATE POLICY "Head and linked members can read messages"
  ON family_messages FOR SELECT TO authenticated
  USING (auth_user_is_group_head(group_id) OR auth_user_is_group_member(group_id));

CREATE POLICY "Head and linked members can send messages"
  ON family_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND (auth_user_is_group_head(group_id) OR auth_user_is_group_member(group_id))
  );

-- ── Step 8: plants — group members can view all plants in their group ──────────

DROP POLICY IF EXISTS "Group members can view all plants in their group" ON plants;

CREATE POLICY "Group members can view all plants in their group"
  ON plants FOR SELECT TO authenticated
  USING (
    farming_group_id IS NOT NULL
    AND farming_group_id IN (SELECT auth_user_farming_group_ids())
  );

-- ── Step 9: user_profiles — members can see each other ────────────────────────

DROP POLICY IF EXISTS "Linked members can see each other's last_seen" ON user_profiles;
DROP POLICY IF EXISTS "Linked members can see each other's presence" ON user_profiles;

CREATE POLICY "Linked members can see each other's presence"
  ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR auth_user_shares_group_with(id));
