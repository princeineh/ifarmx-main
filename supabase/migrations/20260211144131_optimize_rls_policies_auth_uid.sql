/*
  # Optimize RLS policies for auth function performance

  1. Changes
    - Replace all `auth.uid()` calls with `(select auth.uid())` across all policies
    - This prevents re-evaluation of the auth function per row, improving query performance at scale
    - Fix notifications INSERT policy to restrict by user ownership instead of allowing unrestricted access

  2. Tables affected
    - user_profiles (3 policies)
    - programs (4 policies)
    - plants (5 policies)
    - care_logs (5 policies)
    - invites (2 policies)
    - program_participants (4 policies)
    - kit_codes (1 policy)
    - kit_verifications (4 policies)
    - kit_item_checks (2 policies)
    - farming_groups (5 policies)
    - group_members (5 policies)
    - grok_usage (3 policies)
    - product_listings (4 policies)
    - kit_orders (3 policies)
    - order_status_updates (2 policies)
    - kit_code_assignments (5 policies)
    - organization_kit_pools (4 policies)
    - notifications (3 policies including INSERT fix)

  3. Security
    - No permission changes; same access patterns preserved
    - Notifications INSERT now checks user ownership instead of unrestricted access
*/

-- ==========================================
-- user_profiles
-- ==========================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ==========================================
-- programs
-- ==========================================
DROP POLICY IF EXISTS "Org users can view own programs" ON public.programs;
CREATE POLICY "Org users can view own programs"
  ON public.programs FOR SELECT TO authenticated
  USING (org_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Org users can insert own programs" ON public.programs;
CREATE POLICY "Org users can insert own programs"
  ON public.programs FOR INSERT TO authenticated
  WITH CHECK (org_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Org users can update own programs" ON public.programs;
CREATE POLICY "Org users can update own programs"
  ON public.programs FOR UPDATE TO authenticated
  USING (org_user_id = (select auth.uid()))
  WITH CHECK (org_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Org users can delete own programs" ON public.programs;
CREATE POLICY "Org users can delete own programs"
  ON public.programs FOR DELETE TO authenticated
  USING (org_user_id = (select auth.uid()));

-- ==========================================
-- plants
-- ==========================================
DROP POLICY IF EXISTS "Users can view own plants" ON public.plants;
CREATE POLICY "Users can view own plants"
  ON public.plants FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Org users can view program participants' plants" ON public.plants;
CREATE POLICY "Org users can view program participants' plants"
  ON public.plants FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM programs p
    WHERE p.id = plants.program_id AND p.org_user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert own plants" ON public.plants;
CREATE POLICY "Users can insert own plants"
  ON public.plants FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own plants" ON public.plants;
CREATE POLICY "Users can update own plants"
  ON public.plants FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own plants" ON public.plants;
CREATE POLICY "Users can delete own plants"
  ON public.plants FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- ==========================================
-- care_logs
-- ==========================================
DROP POLICY IF EXISTS "Users can view own care logs" ON public.care_logs;
CREATE POLICY "Users can view own care logs"
  ON public.care_logs FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Org users can view program participants' care logs" ON public.care_logs;
CREATE POLICY "Org users can view program participants' care logs"
  ON public.care_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plants p
    JOIN programs pr ON p.program_id = pr.id
    WHERE p.id = care_logs.plant_id AND pr.org_user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert own care logs" ON public.care_logs;
CREATE POLICY "Users can insert own care logs"
  ON public.care_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own care logs" ON public.care_logs;
CREATE POLICY "Users can update own care logs"
  ON public.care_logs FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own care logs" ON public.care_logs;
CREATE POLICY "Users can delete own care logs"
  ON public.care_logs FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- ==========================================
-- invites
-- ==========================================
DROP POLICY IF EXISTS "Org users can create invites for own programs" ON public.invites;
CREATE POLICY "Org users can create invites for own programs"
  ON public.invites FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM programs
    WHERE programs.id = invites.program_id AND programs.org_user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update invites they're using" ON public.invites;
CREATE POLICY "Users can update invites they're using"
  ON public.invites FOR UPDATE TO authenticated
  USING (NOT used OR used_by = (select auth.uid()))
  WITH CHECK (used_by = (select auth.uid()));

-- ==========================================
-- program_participants
-- ==========================================
DROP POLICY IF EXISTS "Users can view own participations" ON public.program_participants;
CREATE POLICY "Users can view own participations"
  ON public.program_participants FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Org users can view own program participants" ON public.program_participants;
CREATE POLICY "Org users can view own program participants"
  ON public.program_participants FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM programs
    WHERE programs.id = program_participants.program_id AND programs.org_user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert own participations" ON public.program_participants;
CREATE POLICY "Users can insert own participations"
  ON public.program_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Org users can update own program participants" ON public.program_participants;
CREATE POLICY "Org users can update own program participants"
  ON public.program_participants FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM programs
    WHERE programs.id = program_participants.program_id AND programs.org_user_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM programs
    WHERE programs.id = program_participants.program_id AND programs.org_user_id = (select auth.uid())
  ));

-- ==========================================
-- kit_codes
-- ==========================================
DROP POLICY IF EXISTS "Users can update codes they're activating" ON public.kit_codes;
CREATE POLICY "Users can update codes they're activating"
  ON public.kit_codes FOR UPDATE TO authenticated
  USING (used = false OR user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ==========================================
-- kit_verifications
-- ==========================================
DROP POLICY IF EXISTS "Users can view own verifications" ON public.kit_verifications;
CREATE POLICY "Users can view own verifications"
  ON public.kit_verifications FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Organization users can view program verifications" ON public.kit_verifications;
CREATE POLICY "Organization users can view program verifications"
  ON public.kit_verifications FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM kit_codes kc
    JOIN programs p ON p.id = kc.program_id
    WHERE kc.id = kit_verifications.kit_code_id AND p.org_user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create own verifications" ON public.kit_verifications;
CREATE POLICY "Users can create own verifications"
  ON public.kit_verifications FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own verifications" ON public.kit_verifications;
CREATE POLICY "Users can update own verifications"
  ON public.kit_verifications FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ==========================================
-- kit_item_checks
-- ==========================================
DROP POLICY IF EXISTS "Users can view own item checks" ON public.kit_item_checks;
CREATE POLICY "Users can view own item checks"
  ON public.kit_item_checks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM kit_verifications kv
    WHERE kv.id = kit_item_checks.verification_id AND kv.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create own item checks" ON public.kit_item_checks;
CREATE POLICY "Users can create own item checks"
  ON public.kit_item_checks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM kit_verifications kv
    WHERE kv.id = kit_item_checks.verification_id AND kv.user_id = (select auth.uid())
  ));

-- ==========================================
-- farming_groups
-- ==========================================
DROP POLICY IF EXISTS "Users can view own farming groups" ON public.farming_groups;
CREATE POLICY "Users can view own farming groups"
  ON public.farming_groups FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Organization users can view groups for their programs" ON public.farming_groups;
CREATE POLICY "Organization users can view groups for their programs"
  ON public.farming_groups FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM kit_codes kc
    JOIN programs p ON p.id = kc.program_id
    WHERE kc.id = farming_groups.kit_code_id AND p.org_user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create own farming groups" ON public.farming_groups;
CREATE POLICY "Users can create own farming groups"
  ON public.farming_groups FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own farming groups" ON public.farming_groups;
CREATE POLICY "Users can update own farming groups"
  ON public.farming_groups FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own farming groups" ON public.farming_groups;
CREATE POLICY "Users can delete own farming groups"
  ON public.farming_groups FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- ==========================================
-- group_members
-- ==========================================
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
CREATE POLICY "Users can view members of their groups"
  ON public.group_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM farming_groups fg
    WHERE fg.id = group_members.group_id AND fg.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Organization users can view group members for their programs" ON public.group_members;
CREATE POLICY "Organization users can view group members for their programs"
  ON public.group_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM farming_groups fg
    JOIN kit_codes kc ON kc.id = fg.kit_code_id
    JOIN programs p ON p.id = kc.program_id
    WHERE fg.id = group_members.group_id AND p.org_user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can add members to their groups" ON public.group_members;
CREATE POLICY "Users can add members to their groups"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM farming_groups fg
    WHERE fg.id = group_members.group_id AND fg.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update members of their groups" ON public.group_members;
CREATE POLICY "Users can update members of their groups"
  ON public.group_members FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM farming_groups fg
    WHERE fg.id = group_members.group_id AND fg.user_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM farming_groups fg
    WHERE fg.id = group_members.group_id AND fg.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete members from their groups" ON public.group_members;
CREATE POLICY "Users can delete members from their groups"
  ON public.group_members FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM farming_groups fg
    WHERE fg.id = group_members.group_id AND fg.user_id = (select auth.uid())
  ));

-- ==========================================
-- grok_usage
-- ==========================================
DROP POLICY IF EXISTS "Users can view own usage data" ON public.grok_usage;
CREATE POLICY "Users can view own usage data"
  ON public.grok_usage FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own usage data" ON public.grok_usage;
CREATE POLICY "Users can insert own usage data"
  ON public.grok_usage FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own usage data" ON public.grok_usage;
CREATE POLICY "Users can update own usage data"
  ON public.grok_usage FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ==========================================
-- product_listings
-- ==========================================
DROP POLICY IF EXISTS "Users can view active listings" ON public.product_listings;
CREATE POLICY "Users can view active listings"
  ON public.product_listings FOR SELECT TO authenticated
  USING (status = 'active' OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own listings" ON public.product_listings;
CREATE POLICY "Users can create own listings"
  ON public.product_listings FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own listings" ON public.product_listings;
CREATE POLICY "Users can update own listings"
  ON public.product_listings FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own listings" ON public.product_listings;
CREATE POLICY "Users can delete own listings"
  ON public.product_listings FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ==========================================
-- kit_orders
-- ==========================================
DROP POLICY IF EXISTS "Users can view own orders" ON public.kit_orders;
CREATE POLICY "Users can view own orders"
  ON public.kit_orders FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON public.kit_orders;
CREATE POLICY "Users can create own orders"
  ON public.kit_orders FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own orders" ON public.kit_orders;
CREATE POLICY "Users can update own orders"
  ON public.kit_orders FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ==========================================
-- order_status_updates
-- ==========================================
DROP POLICY IF EXISTS "Users can view own order status updates" ON public.order_status_updates;
CREATE POLICY "Users can view own order status updates"
  ON public.order_status_updates FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM kit_orders
    WHERE kit_orders.id = order_status_updates.order_id AND kit_orders.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert status updates for own orders" ON public.order_status_updates;
CREATE POLICY "Users can insert status updates for own orders"
  ON public.order_status_updates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM kit_orders
    WHERE kit_orders.id = order_status_updates.order_id AND kit_orders.user_id = (select auth.uid())
  ));

-- ==========================================
-- kit_code_assignments
-- ==========================================
DROP POLICY IF EXISTS "Organizations can view their assignments" ON public.kit_code_assignments;
CREATE POLICY "Organizations can view their assignments"
  ON public.kit_code_assignments FOR SELECT TO authenticated
  USING ((select auth.uid()) = assigned_by_org_id);

DROP POLICY IF EXISTS "Participants can view their assignments" ON public.kit_code_assignments;
CREATE POLICY "Participants can view their assignments"
  ON public.kit_code_assignments FOR SELECT TO authenticated
  USING ((select auth.uid()) = assigned_to_user_id);

DROP POLICY IF EXISTS "Organizations can create assignments" ON public.kit_code_assignments;
CREATE POLICY "Organizations can create assignments"
  ON public.kit_code_assignments FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = assigned_by_org_id);

DROP POLICY IF EXISTS "Organizations can update their assignments" ON public.kit_code_assignments;
CREATE POLICY "Organizations can update their assignments"
  ON public.kit_code_assignments FOR UPDATE TO authenticated
  USING ((select auth.uid()) = assigned_by_org_id)
  WITH CHECK ((select auth.uid()) = assigned_by_org_id);

DROP POLICY IF EXISTS "Organizations can delete their assignments" ON public.kit_code_assignments;
CREATE POLICY "Organizations can delete their assignments"
  ON public.kit_code_assignments FOR DELETE TO authenticated
  USING ((select auth.uid()) = assigned_by_org_id);

-- ==========================================
-- organization_kit_pools
-- ==========================================
DROP POLICY IF EXISTS "Organizations can view their own kit pools" ON public.organization_kit_pools;
CREATE POLICY "Organizations can view their own kit pools"
  ON public.organization_kit_pools FOR SELECT TO authenticated
  USING ((select auth.uid()) = org_user_id);

DROP POLICY IF EXISTS "Organizations can create their own kit pools" ON public.organization_kit_pools;
CREATE POLICY "Organizations can create their own kit pools"
  ON public.organization_kit_pools FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = org_user_id);

DROP POLICY IF EXISTS "Organizations can update their own kit pools" ON public.organization_kit_pools;
CREATE POLICY "Organizations can update their own kit pools"
  ON public.organization_kit_pools FOR UPDATE TO authenticated
  USING ((select auth.uid()) = org_user_id)
  WITH CHECK ((select auth.uid()) = org_user_id);

DROP POLICY IF EXISTS "Organizations can delete their own kit pools" ON public.organization_kit_pools;
CREATE POLICY "Organizations can delete their own kit pools"
  ON public.organization_kit_pools FOR DELETE TO authenticated
  USING ((select auth.uid()) = org_user_id);

-- ==========================================
-- notifications (fix unrestricted INSERT)
-- ==========================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Users can create own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);