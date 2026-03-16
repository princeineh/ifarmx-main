import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { MonitorStats } from './MonitorStats';
import { UserHealthTable } from './UserHealthTable';
import { EncourageModal } from './EncourageModal';
import type {
  MonitorUser, MonitorPlant, PlatformSummary,
  HealthDistribution, StageDistribution, TypeBreakdown,
} from './types';

const WATERING_GOAL = 5;

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Thriving';
  if (score >= 60) return 'Healthy';
  if (score >= 40) return 'Needs Attention';
  if (score >= 20) return 'At Risk';
  return 'Critical';
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function AdminMonitor() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<MonitorUser[]>([]);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [encourageTarget, setEncourageTarget] = useState<MonitorUser[] | null>(null);

  useEffect(() => {
    loadMonitorData();
  }, []);

  const loadMonitorData = async () => {
    setLoading(true);

    const weekStart = getWeekStart().toISOString();
    const now = new Date().toISOString();

    const [plantsRes, logsWeekRes, logsAllRes, kitsRes, profilesRes] = await Promise.all([
      supabase.from('plants').select('id, user_id, name, stage, farming_type, program_id, planted_date, total_seeds'),
      supabase.from('care_logs').select('id, plant_id, user_id, log_date, watered, fertilized, weeded, pest_checked, issue_report').gte('log_date', weekStart.split('T')[0]),
      supabase.from('care_logs').select('id, user_id, log_date', { count: 'exact' }),
      supabase.from('kit_codes').select('id, used'),
      supabase.from('user_profiles').select('id, display_name, user_type, avatar_url'),
    ]);

    const plants: MonitorPlant[] = (plantsRes.data || []).map(p => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      stage: p.stage,
      farming_type: p.farming_type,
      program_id: p.program_id,
      planted_date: p.planted_date,
      total_seeds: p.total_seeds,
    }));

    const weekLogs = logsWeekRes.data || [];
    const allLogsCount = logsAllRes.count || 0;
    const kits = kitsRes.data || [];
    const profiles = profilesRes.data || [];

    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const plantsByUser = new Map<string, MonitorPlant[]>();
    plants.forEach(p => {
      const list = plantsByUser.get(p.user_id) || [];
      list.push(p);
      plantsByUser.set(p.user_id, list);
    });

    const weekLogsByUser = new Map<string, typeof weekLogs>();
    weekLogs.forEach(l => {
      const list = weekLogsByUser.get(l.user_id) || [];
      list.push(l);
      weekLogsByUser.set(l.user_id, list);
    });

    const allLogsByUser = new Map<string, { count: number; lastDate: string | null }>();
    (logsAllRes.data || []).forEach(l => {
      const entry = allLogsByUser.get(l.user_id) || { count: 0, lastDate: null };
      entry.count++;
      if (!entry.lastDate || l.log_date > entry.lastDate) entry.lastDate = l.log_date;
      allLogsByUser.set(l.user_id, entry);
    });

    const monitorUsers: MonitorUser[] = [];
    const healthDist: HealthDistribution = { thriving: 0, healthy: 0, needs_attention: 0, at_risk: 0, critical: 0 };
    const stageDist: StageDistribution = { nursery: 0, transplant: 0, flowering: 0, fruiting: 0, harvest: 0 };
    const typeData: Record<string, { count: number; totalHealth: number }> = {
      individual: { count: 0, totalHealth: 0 },
      family: { count: 0, totalHealth: 0 },
      organization: { count: 0, totalHealth: 0 },
    };

    const stageOrder = ['nursery', 'transplant', 'flowering', 'fruiting', 'harvest'];

    plantsByUser.forEach((userPlants, userId) => {
      const prof = profileMap.get(userId);
      if (!userPlants.length) return;

      const userWeekLogs = weekLogsByUser.get(userId) || [];
      const allUserData = allLogsByUser.get(userId) || { count: 0, lastDate: null };

      const wateredDays = new Set(userWeekLogs.filter(l => l.watered).map(l => l.log_date)).size;
      const fertilizedCount = userWeekLogs.filter(l => l.fertilized).length;
      const weededCount = userWeekLogs.filter(l => l.weeded).length;
      const pestCount = userWeekLogs.filter(l => l.pest_checked).length;
      const issuesCount = userWeekLogs.filter(l => l.issue_report).length;

      const waterScore = Math.min(wateredDays / WATERING_GOAL, 1) * 60;
      const careActivities = fertilizedCount + weededCount + pestCount;
      const maxCareActivities = userWeekLogs.length > 0 ? userWeekLogs.length * 3 : 1;
      const careBonus = Math.min(careActivities / maxCareActivities, 1) * 40;
      const healthScore = Math.min(waterScore + careBonus, 100);

      const label = getHealthLabel(healthScore);

      let highestStage = 'nursery';
      userPlants.forEach(p => {
        const key = p.stage as keyof StageDistribution;
        if (key in stageDist) stageDist[key]++;
        if (stageOrder.indexOf(p.stage) > stageOrder.indexOf(highestStage)) {
          highestStage = p.stage;
        }
      });

      const lastLogDate = allUserData.lastDate;
      let daysInactive = 0;
      if (lastLogDate) {
        const last = new Date(lastLogDate);
        daysInactive = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysInactive = 999;
      }

      const programIds = [...new Set(userPlants.map(p => p.program_id).filter(Boolean))];

      const monitorUser: MonitorUser = {
        user_id: userId,
        display_name: prof?.display_name || 'Unknown',
        user_type: prof?.user_type || 'individual',
        avatar_url: prof?.avatar_url || null,
        plants: userPlants,
        health_score: healthScore,
        health_label: label,
        watering_days: wateredDays,
        care_logs_week: userWeekLogs.length,
        care_logs_total: allUserData.count,
        last_log_date: lastLogDate,
        days_inactive: daysInactive,
        stage_highest: highestStage,
        issues_reported: issuesCount,
        program_names: [],
      };

      monitorUsers.push(monitorUser);

      switch (label) {
        case 'Thriving': healthDist.thriving++; break;
        case 'Healthy': healthDist.healthy++; break;
        case 'Needs Attention': healthDist.needs_attention++; break;
        case 'At Risk': healthDist.at_risk++; break;
        case 'Critical': healthDist.critical++; break;
      }

      const userType = prof?.user_type || 'individual';
      const typeKey = userType in typeData ? userType : 'individual';
      typeData[typeKey].count++;
      typeData[typeKey].totalHealth += healthScore;
    });

    const totalUsersWithPlants = monitorUsers.length;
    const avgHealth = totalUsersWithPlants > 0
      ? monitorUsers.reduce((sum, u) => sum + u.health_score, 0) / totalUsersWithPlants
      : 0;
    const avgWatering = totalUsersWithPlants > 0
      ? monitorUsers.reduce((sum, u) => sum + u.watering_days, 0) / totalUsersWithPlants
      : 0;

    const typeBreakdown: TypeBreakdown = {
      individual: { count: typeData.individual.count, avg_health: typeData.individual.count > 0 ? typeData.individual.totalHealth / typeData.individual.count : 0 },
      family: { count: typeData.family.count, avg_health: typeData.family.count > 0 ? typeData.family.totalHealth / typeData.family.count : 0 },
      organization: { count: typeData.organization.count, avg_health: typeData.organization.count > 0 ? typeData.organization.totalHealth / typeData.organization.count : 0 },
    };

    const platformSummary: PlatformSummary = {
      total_active_plants: plants.length,
      total_users_with_plants: totalUsersWithPlants,
      total_care_logs_week: weekLogs.length,
      total_care_logs_all: allLogsCount,
      avg_health_score: avgHealth,
      avg_watering_days: avgWatering,
      health_distribution: healthDist,
      stage_distribution: stageDist,
      type_breakdown: typeBreakdown,
      kits_activated: kits.filter(k => k.used).length,
      kits_total: kits.length,
    };

    setSummary(platformSummary);
    setUsers(monitorUsers);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Central Monitor</h2>
        <p className="text-xs text-gray-500">Platform-wide kit and plant health monitoring</p>
      </div>

      <MonitorStats summary={summary} />

      <UserHealthTable
        users={users}
        onEncourage={(user) => setEncourageTarget([user])}
        onBulkEncourage={(selected) => setEncourageTarget(selected)}
      />

      {encourageTarget && (
        <EncourageModal
          users={encourageTarget}
          onClose={() => setEncourageTarget(null)}
          onSent={() => setEncourageTarget(null)}
        />
      )}
    </div>
  );
}
