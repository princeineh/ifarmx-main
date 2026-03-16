/*
  # Fix missing foreign key indexes and clean up duplicates

  1. Missing FK Indexes Added
    - `ambassadors.appointed_by` - covers `ambassadors_appointed_by_fkey`
    - `care_logs.proxy_logged_by` - covers `care_logs_proxy_logged_by_fkey`
    - `program_applications.reviewed_by` - covers `program_applications_reviewed_by_fkey`
    - `program_participants.application_id` - covers `program_participants_application_id_fkey`

  2. Duplicate Indexes Removed
    - `idx_notifications_user` (duplicate of `idx_notifications_user_id`)
    - `idx_user_profiles_state` (duplicate of `idx_user_profiles_state_of_origin`)

  3. Unused Indexes Removed
    - Removed indexes that have never been scanned to reduce write overhead
    - These can be recreated if query patterns change

  4. Important Notes
    - Adding FK indexes improves JOIN and cascade performance
    - Dropping unused indexes reduces storage and write amplification
*/

-- 1. Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ambassadors_appointed_by ON public.ambassadors(appointed_by);
CREATE INDEX IF NOT EXISTS idx_care_logs_proxy_logged_by ON public.care_logs(proxy_logged_by);
CREATE INDEX IF NOT EXISTS idx_program_applications_reviewed_by ON public.program_applications(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_program_participants_application_id ON public.program_participants(application_id);

-- 2. Drop duplicate indexes
DROP INDEX IF EXISTS public.idx_notifications_user;
DROP INDEX IF EXISTS public.idx_user_profiles_state;

-- 3. Drop unused indexes
DROP INDEX IF EXISTS public.idx_programs_status;
DROP INDEX IF EXISTS public.idx_plants_farming_group_id;
DROP INDEX IF EXISTS public.idx_plants_kit_code_id;
DROP INDEX IF EXISTS public.idx_plants_assigned_member;
DROP INDEX IF EXISTS public.idx_plants_group_member_id;
DROP INDEX IF EXISTS public.idx_care_logs_user_id;
DROP INDEX IF EXISTS public.idx_invites_program_id;
DROP INDEX IF EXISTS public.idx_invites_used_by;
DROP INDEX IF EXISTS public.idx_kit_verifications_kit_code_id;
DROP INDEX IF EXISTS public.idx_kit_verifications_user_id;
DROP INDEX IF EXISTS public.idx_kit_item_checks_kit_item_id;
DROP INDEX IF EXISTS public.idx_kit_item_checks_verification_id;
DROP INDEX IF EXISTS public.idx_farming_groups_kit_code_id;
DROP INDEX IF EXISTS public.idx_farming_groups_user_id;
DROP INDEX IF EXISTS public.idx_kit_orders_order_number;
DROP INDEX IF EXISTS public.idx_kit_orders_program_id;
DROP INDEX IF EXISTS public.idx_kit_orders_admin_approved;
DROP INDEX IF EXISTS public.idx_product_listings_category;
DROP INDEX IF EXISTS public.idx_group_members_linked_user;
DROP INDEX IF EXISTS public.idx_kit_codes_user_id;
DROP INDEX IF EXISTS public.idx_kit_codes_assigned_to;
DROP INDEX IF EXISTS public.idx_kit_codes_assigned_by_org_id;
DROP INDEX IF EXISTS public.idx_kit_codes_program_id;
DROP INDEX IF EXISTS public.idx_kit_pools_org_user;
DROP INDEX IF EXISTS public.idx_kit_pools_program;
DROP INDEX IF EXISTS public.idx_kit_assignments_kit_code;
DROP INDEX IF EXISTS public.idx_kit_assignments_assigned_to;
DROP INDEX IF EXISTS public.idx_kit_assignments_assigned_by;
DROP INDEX IF EXISTS public.idx_grok_usage_last_reset_date;
DROP INDEX IF EXISTS public.idx_notifications_read;
DROP INDEX IF EXISTS public.idx_appreciations_program_id;
DROP INDEX IF EXISTS public.idx_appreciations_sender_id;
DROP INDEX IF EXISTS public.idx_appreciations_created_at;
DROP INDEX IF EXISTS public.idx_program_kit_purchases_program_id;
DROP INDEX IF EXISTS public.idx_program_kit_purchases_ordered_by;
DROP INDEX IF EXISTS public.idx_ambassadors_program_id;
DROP INDEX IF EXISTS public.idx_ambassadors_user_id;
DROP INDEX IF EXISTS public.idx_user_profiles_state_of_origin;
DROP INDEX IF EXISTS public.idx_user_profiles_gender;
DROP INDEX IF EXISTS public.idx_ambassador_tasks_ambassador_id;
DROP INDEX IF EXISTS public.idx_program_invoices_org_user_id;
DROP INDEX IF EXISTS public.idx_page_views_user_id;
DROP INDEX IF EXISTS public.idx_page_views_page;
DROP INDEX IF EXISTS public.idx_page_views_session_id;
DROP INDEX IF EXISTS public.idx_user_events_user_id;
DROP INDEX IF EXISTS public.idx_user_events_event_type;
DROP INDEX IF EXISTS public.idx_notifications_user_id;
