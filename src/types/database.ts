export type UserType = 'individual' | 'organization' | 'family';
export type PlantStage = 'nursery' | 'transplant' | 'flowering' | 'fruiting' | 'harvest';
export type ParticipantStatus = 'active' | 'inactive';
export type FarmingType = 'individual' | 'family' | 'group';
export type GroupType = 'family' | 'group';
export type ProgramStatus = 'draft' | 'published' | 'closed';
export type AcceptanceType = 'invite_only' | 'open';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface UserProfile {
  id: string;
  user_type: UserType;
  favorite_dish: string | null;
  region_vibe: string | null;
  display_name: string | null;
  avatar_url: string | null;
  state_of_origin: string | null;
  lga: string | null;
  location: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  phone_number: string | null;
  gender: string | null;
  disabilities: string | null;
  health_challenge: string | null;
  is_admin: boolean;
  tour_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface KitCode {
  id: string;
  code: string;
  used: boolean;
  user_id: string | null;
  program_id: string | null;
  activated_at: string | null;
  created_at: string;
  assigned_to_user_id: string | null;
  assigned_by_org_id: string | null;
  assignment_date: string | null;
}

export interface Plant {
  id: string;
  user_id: string;
  kit_code_id: string | null;
  program_id: string | null;
  name: string;
  stage: PlantStage;
  planted_date: string;
  land_volunteer: boolean;
  farming_type: FarmingType;
  farming_group_id: string | null;
  group_member_id: string | null;
  total_seeds: number;
  created_at: string;
  updated_at: string;
}

export interface CareLog {
  id: string;
  plant_id: string;
  user_id: string;
  log_date: string;
  notes: string | null;
  issue_report: string | null;
  photo_url: string | null;
  watered: boolean;
  fertilized: boolean;
  weeded: boolean;
  pruned: boolean;
  pest_checked: boolean;
  seeds_with_issues: number;
  created_at: string;
}

export interface Program {
  id: string;
  org_user_id: string;
  name: string;
  description: string | null;
  target_participants: number;
  start_date: string | null;
  status: ProgramStatus;
  acceptance_type: AcceptanceType;
  min_kits_per_participant: number;
  max_kits_per_participant: number;
  created_at: string;
  updated_at: string;
}

export interface Invite {
  id: string;
  program_id: string;
  code: string;
  email: string | null;
  expires_at: string | null;
  used: boolean;
  used_by: string | null;
  created_at: string;
}

export interface ProgramParticipant {
  id: string;
  program_id: string;
  user_id: string;
  joined_at: string;
  status: ParticipantStatus;
  application_id: string | null;
  kit_code_assigned: boolean;
  kit_activated: boolean;
  approved_kits: number;
}

export interface ProgramApplication {
  id: string;
  program_id: string;
  user_id: string;
  status: ApplicationStatus;
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
  requested_kits: number;
}

export interface KitItem {
  id: string;
  name: string;
  description: string | null;
  is_required: boolean;
  display_order: number;
  created_at: string;
}

export interface KitVerification {
  id: string;
  kit_code_id: string;
  user_id: string;
  verified_at: string;
  all_items_present: boolean;
  missing_items: string[];
  notes: string | null;
  alarm_raised: boolean;
  created_at: string;
}

export interface KitItemCheck {
  id: string;
  verification_id: string;
  kit_item_id: string;
  is_present: boolean;
  created_at: string;
}

export interface FarmingGroup {
  id: string;
  user_id: string;
  head_user_id: string | null;
  kit_code_id: string | null;
  group_type: GroupType;
  group_name: string;
  total_seeds: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  name: string;
  relationship: string | null;
  seeds_allocated: number;
  phone: string | null;
  linked_user_id: string | null;
  is_custodian_child: boolean;
  created_at: string;
}

export interface FamilyInvite {
  id: string;
  group_id: string;
  code: string;
  created_by: string | null;
  expires_at: string;
  used_by_user_id: string | null;
  used_at: string | null;
  created_at: string;
}

export interface FamilyJoinRequest {
  id: string;
  group_id: string;
  requester_user_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface FamilyMessage {
  id: string;
  group_id: string;
  sender_user_id: string | null;
  sender_name: string;
  message: string;
  created_at: string;
}

export type ProductCategory = 'palm_oil' | 'palm_kernel' | 'seedlings' | 'tools' | 'other';
export type ListingStatus = 'active' | 'sold' | 'paused';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DeliveryStatus = 'processing' | 'shipped' | 'in_transit' | 'delivered';

export interface ProductListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  quantity_available: number;
  location: string;
  status: ListingStatus;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface KitOrder {
  id: string;
  user_id: string;
  order_number: string;
  kit_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  delivery_status: DeliveryStatus;
  delivery_address: string;
  delivery_state: string;
  delivery_phone: string;
  kit_codes_assigned: string[];
  program_id: string | null;
  admin_approved: boolean;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusUpdate {
  id: string;
  order_id: string;
  status: string;
  message: string;
  created_at: string;
}

export type BadgeType = 'top_performer' | 'most_improved' | 'consistent' | 'special';
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type NotificationType = 'appreciation' | 'system' | 'program_update' | 'reminder';

export interface Appreciation {
  id: string;
  program_id: string;
  sender_id: string;
  recipient_id: string;
  title: string;
  message: string;
  badge_type: BadgeType;
  period_type: PeriodType;
  period_label: string;
  email_sent: boolean;
  read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface GrokUsage {
  id: string;
  user_id: string;
  messages_count: number;
  last_reset_date: string;
  total_messages: number;
  created_at: string;
  updated_at: string;
}

export interface KitCodeAssignment {
  id: string;
  kit_code_id: string;
  assigned_to_user_id: string;
  assigned_by_org_id: string | null;
  assignment_date: string;
  notification_method: string;
  notification_sent: boolean;
  notification_sent_at: string | null;
  notification_message: string | null;
}

export interface OrganizationKitPool {
  id: string;
  org_user_id: string;
  program_id: string;
  code_prefix: string;
  total_codes: number;
  available_codes: number;
  created_at: string;
}

export interface ProgramKitPurchase {
  id: string;
  program_id: string;
  ordered_by: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: string;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ambassador {
  id: string;
  program_id: string;
  user_id: string;
  appointed_by: string;
  role_title: string;
  area_description: string | null;
  status: string;
  created_at: string;
}

export interface AmbassadorTask {
  id: string;
  ambassador_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface ProgramInvoice {
  id: string;
  program_id: string;
  org_user_id: string;
  invoice_number: string;
  kit_quantity: number;
  unit_price: number;
  total_amount: number;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Partial<UserProfile> & { id: string };
        Update: Partial<UserProfile>;
      };
      kit_codes: {
        Row: KitCode;
        Insert: Partial<KitCode> & { code: string };
        Update: Partial<KitCode>;
      };
      plants: {
        Row: Plant;
        Insert: Partial<Plant> & { user_id: string; name: string };
        Update: Partial<Plant>;
      };
      care_logs: {
        Row: CareLog;
        Insert: Partial<CareLog> & { plant_id: string; user_id: string };
        Update: Partial<CareLog>;
      };
      programs: {
        Row: Program;
        Insert: Partial<Program> & { org_user_id: string; name: string };
        Update: Partial<Program>;
      };
      invites: {
        Row: Invite;
        Insert: Partial<Invite> & { program_id: string; code: string };
        Update: Partial<Invite>;
      };
      program_participants: {
        Row: ProgramParticipant;
        Insert: Partial<ProgramParticipant> & { program_id: string; user_id: string };
        Update: Partial<ProgramParticipant>;
      };
      program_applications: {
        Row: ProgramApplication;
        Insert: Partial<ProgramApplication> & { program_id: string; user_id: string };
        Update: Partial<ProgramApplication>;
      };
      kit_items: {
        Row: KitItem;
        Insert: Partial<KitItem> & { name: string };
        Update: Partial<KitItem>;
      };
      kit_verifications: {
        Row: KitVerification;
        Insert: Partial<KitVerification> & { kit_code_id: string; user_id: string };
        Update: Partial<KitVerification>;
      };
      kit_item_checks: {
        Row: KitItemCheck;
        Insert: Partial<KitItemCheck> & { verification_id: string; kit_item_id: string };
        Update: Partial<KitItemCheck>;
      };
      farming_groups: {
        Row: FarmingGroup;
        Insert: Partial<FarmingGroup> & { user_id: string; group_type: GroupType; group_name: string };
        Update: Partial<FarmingGroup>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Partial<GroupMember> & { group_id: string; name: string };
        Update: Partial<GroupMember>;
      };
      product_listings: {
        Row: ProductListing;
        Insert: Partial<ProductListing> & { user_id: string; title: string };
        Update: Partial<ProductListing>;
      };
      kit_orders: {
        Row: KitOrder;
        Insert: Partial<KitOrder> & { user_id: string; order_number: string };
        Update: Partial<KitOrder>;
      };
      order_status_updates: {
        Row: OrderStatusUpdate;
        Insert: Partial<OrderStatusUpdate> & { order_id: string; status: string };
        Update: Partial<OrderStatusUpdate>;
      };
      appreciations: {
        Row: Appreciation;
        Insert: Partial<Appreciation> & { program_id: string; sender_id: string; recipient_id: string };
        Update: Partial<Appreciation>;
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & { user_id: string; type: string; title: string; message: string };
        Update: Partial<Notification>;
      };
      grok_usage: {
        Row: GrokUsage;
        Insert: Partial<GrokUsage> & { user_id: string };
        Update: Partial<GrokUsage>;
      };
      kit_code_assignments: {
        Row: KitCodeAssignment;
        Insert: Partial<KitCodeAssignment> & { kit_code_id: string; assigned_to_user_id: string };
        Update: Partial<KitCodeAssignment>;
      };
      organization_kit_pools: {
        Row: OrganizationKitPool;
        Insert: Partial<OrganizationKitPool> & { org_user_id: string; program_id: string; code_prefix: string };
        Update: Partial<OrganizationKitPool>;
      };
      program_kit_purchases: {
        Row: ProgramKitPurchase;
        Insert: Partial<ProgramKitPurchase> & { program_id: string; ordered_by: string };
        Update: Partial<ProgramKitPurchase>;
      };
      ambassadors: {
        Row: Ambassador;
        Insert: Partial<Ambassador> & { program_id: string; user_id: string; appointed_by: string };
        Update: Partial<Ambassador>;
      };
      ambassador_tasks: {
        Row: AmbassadorTask;
        Insert: Partial<AmbassadorTask> & { ambassador_id: string; title: string };
        Update: Partial<AmbassadorTask>;
      };
      program_invoices: {
        Row: ProgramInvoice;
        Insert: Partial<ProgramInvoice> & { program_id: string; org_user_id: string; invoice_number: string };
        Update: Partial<ProgramInvoice>;
      };
    };
  };
}
