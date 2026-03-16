export interface MonitorPlant {
  id: string;
  user_id: string;
  name: string;
  stage: string;
  farming_type: string;
  program_id: string | null;
  planted_date: string;
  total_seeds: number;
}

export interface MonitorUser {
  user_id: string;
  display_name: string;
  user_type: string;
  avatar_url: string | null;
  plants: MonitorPlant[];
  health_score: number;
  health_label: string;
  watering_days: number;
  care_logs_week: number;
  care_logs_total: number;
  last_log_date: string | null;
  days_inactive: number;
  stage_highest: string;
  issues_reported: number;
  program_names: string[];
}

export interface HealthDistribution {
  thriving: number;
  healthy: number;
  needs_attention: number;
  at_risk: number;
  critical: number;
}

export interface StageDistribution {
  nursery: number;
  transplant: number;
  flowering: number;
  fruiting: number;
  harvest: number;
}

export interface TypeBreakdown {
  individual: { count: number; avg_health: number };
  family: { count: number; avg_health: number };
  organization: { count: number; avg_health: number };
}

export interface PlatformSummary {
  total_active_plants: number;
  total_users_with_plants: number;
  total_care_logs_week: number;
  total_care_logs_all: number;
  avg_health_score: number;
  avg_watering_days: number;
  health_distribution: HealthDistribution;
  stage_distribution: StageDistribution;
  type_breakdown: TypeBreakdown;
  kits_activated: number;
  kits_total: number;
}
