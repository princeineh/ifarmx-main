import type { Plant, CareLog, PlantStage, FarmingType } from '../../types/database';

export interface ParticipantStats {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  user_type: string;
  region_vibe: string | null;
  favorite_dish: string | null;
  joined_program_at: string;
  account_created_at: string;
  participant_status: string;
  plants_count: number;
  logs_count: number;
  expected_logs: number;
  compliance: number;
  health_score: number;
  last_log_date: string | null;
  status: 'excellent' | 'good' | 'needs_attention';
  medal: 'gold' | 'silver' | 'bronze' | 'none';
  watering_score: number;
  fertilizing_count_week: number;
  fertilizing_count_month: number;
  weeding_count_week: number;
  weeding_count_month: number;
  pest_count_week: number;
  pest_count_month: number;
  active_days_30: number;
  current_streak: number;
  days_in_program: number;
  highest_stage: PlantStage | null;
  weakest_area: string;
  strongest_area: string;
  plants: PlantInfo[];
  recent_logs: RecentLog[];
  issue_reports: IssueReport[];
  watering_days_this_week: boolean[];
}

export interface PlantInfo {
  id: string;
  name: string;
  stage: PlantStage;
  planted_date: string;
  days_growing: number;
  farming_type: FarmingType;
  group_name: string | null;
}

export interface RecentLog {
  id: string;
  log_date: string;
  plant_name: string;
  watered: boolean;
  fertilized: boolean;
  weeded: boolean;
  pruned: boolean;
  pest_checked: boolean;
  notes: string | null;
  issue_report: string | null;
  photo_url: string | null;
}

export interface IssueReport {
  id: string;
  log_date: string;
  plant_name: string;
  issue_report: string;
  photo_url: string | null;
}
