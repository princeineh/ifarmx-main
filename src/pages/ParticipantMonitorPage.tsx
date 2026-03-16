import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Search, Users, ChevronDown,
  BarChart3, Trophy, AlertTriangle, LayoutGrid, List, Activity
} from 'lucide-react';
import type { Program } from '../types/database';
import type { ParticipantStats, PlantInfo, RecentLog, IssueReport } from '../components/monitor/types';
import { MonitorSummary } from '../components/monitor/MonitorSummary';
import { TierSection } from '../components/monitor/TierSection';
import { ParticipantDetail } from '../components/monitor/ParticipantDetail';
import { ParticipantAvatar } from '../components/monitor/ParticipantAvatar';
import { MonitorReports } from '../components/monitor/MonitorReports';
import { TopPerformers } from '../components/monitor/TopPerformers';
import { SupportRequired } from '../components/monitor/SupportRequired';
import { AppreciationModal } from '../components/monitor/AppreciationModal';
import { EncourageModal } from '../components/program/EncourageModal';

interface ParticipantMonitorPageProps {
  onNavigate: (page: string) => void;
  initialProgramId?: string | null;
}

type MonitorTab = 'overview' | 'reports' | 'leaderboard' | 'support';
type SortKey = 'health_score' | 'compliance' | 'last_log_date' | 'plants_count';

const stageRank: Record<string, number> = {
  harvest: 5, fruiting: 4, flowering: 3, transplant: 2, nursery: 1,
};

const monitorTabs: { key: MonitorTab; label: string; icon: typeof Activity }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'leaderboard', label: 'Top Performers', icon: Trophy },
  { key: 'support', label: 'Support Required', icon: AlertTriangle },
];

export function ParticipantMonitorPage({ onNavigate, initialProgramId }: ParticipantMonitorPageProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(initialProgramId || null);
  const [participants, setParticipants] = useState<ParticipantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('health_score');
  const [viewMode, setViewMode] = useState<'tiers' | 'table'>('tiers');
  const [tierFilters, setTierFilters] = useState({ excellent: true, good: true, needs_attention: true });
  const [activeTab, setActiveTab] = useState<MonitorTab>('overview');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [appreciationTarget, setAppreciationTarget] = useState<ParticipantStats[] | null>(null);
  const [encouragementTarget, setEncouragementTarget] = useState<{ participant: ParticipantStats; urgency: 'critical' | 'warning' | 'mild' } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (user && profile?.user_type === 'organization') {
      loadPrograms();
    } else {
      setLoading(false);
    }
  }, [user, profile, authLoading]);

  useEffect(() => {
    if (selectedProgramId) {
      loadParticipants(selectedProgramId);
    }
  }, [selectedProgramId, reportPeriod]);

  const loadPrograms = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('programs')
        .select('*')
        .eq('org_user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setPrograms(data);
        if (!selectedProgramId && data.length > 0) {
          setSelectedProgramId(data[0].id);
        }
      }
    } catch (err) {
      console.error('ParticipantMonitor: Error loading programs:', err);
    }
    if (!selectedProgramId) setLoading(false);
  };

  const loadParticipants = async (programId: string) => {
    setLoading(true);
    try {
      const { data: participantsData } = await supabase
        .from('program_participants')
        .select('*')
        .eq('program_id', programId);

      if (!participantsData || participantsData.length === 0) {
        setParticipants([]);
        setLoading(false);
        setRefreshedAt(new Date());
        return;
      }

      const userIds = participantsData.map(p => p.user_id);
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, user_type, region_vibe, favorite_dish, created_at')
        .in('id', userIds);

      const profileMap = new Map((profilesData || []).map(p => [p.id, p]));

      const stats: ParticipantStats[] = [];

      for (const participant of participantsData) {
        const profileData = profileMap.get(participant.user_id) as any;

        const email = profileData?.display_name || 'Participant';

        const { data: plants } = await supabase
          .from('plants')
          .select('*, farming_groups(group_name)')
          .eq('user_id', participant.user_id)
          .eq('program_id', programId);

        const plantInfos: PlantInfo[] = (plants || []).map((pl: any) => ({
          id: pl.id,
          name: pl.name,
          stage: pl.stage,
          planted_date: pl.planted_date,
          days_growing: Math.floor((Date.now() - new Date(pl.planted_date).getTime()) / (1000 * 60 * 60 * 24)),
          farming_type: pl.farming_type,
          group_name: pl.farming_groups?.group_name || null,
        }));

        let allLogs: any[] = [];
        if (plants && plants.length > 0) {
          const plantIds = plants.map((p: any) => p.id);

          const now = new Date();
          let dateFilter: string | null = null;

          switch (reportPeriod) {
            case 'daily':
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              dateFilter = today.toISOString().split('T')[0];
              break;
            case 'weekly': {
              const dayOfWeek = now.getDay();
              const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              const weekStart = new Date(now);
              weekStart.setDate(now.getDate() - diff);
              weekStart.setHours(0, 0, 0, 0);
              dateFilter = weekStart.toISOString().split('T')[0];
              break;
            }
            case 'monthly': {
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
              dateFilter = monthStart.toISOString().split('T')[0];
              break;
            }
            case 'yearly': {
              const yearStart = new Date(now.getFullYear(), 0, 1);
              dateFilter = yearStart.toISOString().split('T')[0];
              break;
            }
          }

          let query = supabase
            .from('care_logs')
            .select('*')
            .in('plant_id', plantIds)
            .order('log_date', { ascending: false });

          if (dateFilter) {
            query = query.gte('log_date', dateFilter);
          }

          const { data: logs } = await query.limit(500);
          allLogs = logs || [];
        }

        const plantNameMap: Record<string, string> = {};
        (plants || []).forEach((pl: any) => { plantNameMap[pl.id] = pl.name; });

        const recentLogs: RecentLog[] = allLogs.slice(0, 15).map((log: any) => ({
          id: log.id,
          log_date: log.log_date,
          plant_name: plantNameMap[log.plant_id] || 'Unknown',
          watered: log.watered,
          fertilized: log.fertilized,
          weeded: log.weeded,
          pruned: log.pruned,
          pest_checked: log.pest_checked,
          notes: log.notes,
          issue_report: log.issue_report,
          photo_url: log.photo_url,
        }));

        const issueReports: IssueReport[] = allLogs
          .filter((log: any) => log.issue_report)
          .map((log: any) => ({
            id: log.id,
            log_date: log.log_date,
            plant_name: plantNameMap[log.plant_id] || 'Unknown',
            issue_report: log.issue_report,
            photo_url: log.photo_url,
          }));

        const now = new Date();
        const daysSinceJoined = Math.floor((now.getTime() - new Date(participant.joined_at).getTime()) / (1000 * 60 * 60 * 24));
        const expectedLogs = Math.max(Math.min(daysSinceJoined, 30), 1);
        const logsCount = allLogs.length;
        const compliance = Math.min(Math.round((logsCount / expectedLogs) * 100), 100);

        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const weekLogs = allLogs.filter(l => new Date(l.log_date) >= weekStart);
        const monthLogs = allLogs.filter(l => new Date(l.log_date) >= monthStart);

        const wateringDaysSet = new Set(weekLogs.filter((l: any) => l.watered).map((l: any) => l.log_date));
        const wateringDaysCount = wateringDaysSet.size;
        const wateringScore = Math.min(Math.round((wateringDaysCount / 5) * 100), 100);

        const wateringDaysThisWeek: boolean[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          wateringDaysThisWeek.push(wateringDaysSet.has(dateStr));
        }

        const fertWeek = weekLogs.filter((l: any) => l.fertilized).length;
        const fertMonth = monthLogs.filter((l: any) => l.fertilized).length;
        const weedWeek = weekLogs.filter((l: any) => l.weeded).length;
        const weedMonth = monthLogs.filter((l: any) => l.weeded).length;
        const pestWeek = weekLogs.filter((l: any) => l.pest_checked).length;
        const pestMonth = monthLogs.filter((l: any) => l.pest_checked).length;

        const otherScore = expectedLogs > 0
          ? Math.min(Math.round(((fertMonth + weedMonth + pestMonth) / (expectedLogs * 3)) * 100), 100)
          : 0;
        const healthScore = Math.round(wateringScore * 0.6 + otherScore * 0.4);

        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentForActive = allLogs.filter(l => new Date(l.log_date) >= thirtyDaysAgo);
        const activeDays30 = new Set(recentForActive.map((l: any) => l.log_date)).size;

        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const logDateSet = new Set(allLogs.map((l: any) => l.log_date));
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (logDateSet.has(dateStr)) {
            currentStreak++;
          } else {
            break;
          }
        }

        let status: 'excellent' | 'good' | 'needs_attention';
        if (compliance >= 80) status = 'excellent';
        else if (compliance >= 50) status = 'good';
        else status = 'needs_attention';

        let medal: 'gold' | 'silver' | 'bronze' | 'none';
        if (wateringScore >= 80) medal = 'gold';
        else if (wateringScore >= 60) medal = 'silver';
        else if (wateringScore >= 40) medal = 'bronze';
        else medal = 'none';

        const highestStage = plantInfos.length > 0
          ? plantInfos.reduce((best, p) => (stageRank[p.stage] || 0) > (stageRank[best.stage] || 0) ? p : best).stage
          : null;

        const scores = {
          Watering: wateringScore,
          Fertilizing: expectedLogs > 0 ? Math.round((fertMonth / expectedLogs) * 100) : 0,
          Weeding: expectedLogs > 0 ? Math.round((weedMonth / expectedLogs) * 100) : 0,
          'Pest Monitoring': expectedLogs > 0 ? Math.round((pestMonth / expectedLogs) * 100) : 0,
        };
        const scoreEntries = Object.entries(scores);
        scoreEntries.sort((a, b) => a[1] - b[1]);
        const weakest = scoreEntries[0][0];
        const strongest = scoreEntries[scoreEntries.length - 1][0];

        const lastLogDate = allLogs.length > 0 ? allLogs[0].log_date : null;

        stats.push({
          user_id: participant.user_id,
          email,
          display_name: profileData?.display_name || null,
          avatar_url: profileData?.avatar_url || null,
          user_type: profileData?.user_type || 'individual',
          region_vibe: profileData?.region_vibe || null,
          favorite_dish: profileData?.favorite_dish || null,
          joined_program_at: participant.joined_at,
          account_created_at: profileData?.created_at || participant.joined_at,
          participant_status: participant.status,
          plants_count: plantInfos.length,
          logs_count: logsCount,
          expected_logs: expectedLogs,
          compliance,
          health_score: healthScore,
          last_log_date: lastLogDate,
          status,
          medal,
          watering_score: wateringScore,
          fertilizing_count_week: fertWeek,
          fertilizing_count_month: fertMonth,
          weeding_count_week: weedWeek,
          weeding_count_month: weedMonth,
          pest_count_week: pestWeek,
          pest_count_month: pestMonth,
          active_days_30: activeDays30,
          current_streak: currentStreak,
          days_in_program: daysSinceJoined,
          highest_stage: highestStage,
          weakest_area: weakest,
          strongest_area: strongest,
          plants: plantInfos,
          recent_logs: recentLogs,
          issue_reports: issueReports,
          watering_days_this_week: wateringDaysThisWeek,
        });
      }

      setParticipants(stats);
      setRefreshedAt(new Date());
    } catch (err) {
      console.error('Error loading participants:', err);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = participants.filter(p => tierFilters[p.status]);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.display_name || '').toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      switch (sortKey) {
        case 'health_score': return b.health_score - a.health_score;
        case 'compliance': return b.compliance - a.compliance;
        case 'plants_count': return b.plants_count - a.plants_count;
        case 'last_log_date':
          if (!a.last_log_date) return 1;
          if (!b.last_log_date) return -1;
          return new Date(b.last_log_date).getTime() - new Date(a.last_log_date).getTime();
        default: return 0;
      }
    });
    return result;
  }, [participants, searchQuery, sortKey, tierFilters]);

  const excellent = filtered.filter(p => p.status === 'excellent');
  const good = filtered.filter(p => p.status === 'good');
  const needsAttention = filtered.filter(p => p.status === 'needs_attention');
  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  if (profile?.user_type !== 'organization') {
    return (
      <div className="min-h-screen mud-texture adinkra-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-md">
          <Users className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Access Only</h2>
          <p className="text-gray-600 mb-6">This dashboard is available for organization accounts.</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Participant Monitor</h1>
            {selectedProgram && (
              <p className="text-sm text-gray-500 mt-0.5">{selectedProgram.name}</p>
            )}
          </div>
          {programs.length > 1 && (
            <div className="relative">
              <select
                value={selectedProgramId || ''}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
          <div className="flex overflow-x-auto">
            {monitorTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.key === 'support' && participants.filter(p => p.status === 'needs_attention').length > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                    {participants.filter(p => p.status === 'needs_attention').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading participant data...</p>
            </div>
          </div>
        ) : participants.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No participants enrolled yet. Share invite codes from the Programs page.</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <MonitorSummary
                  participants={participants}
                  onRefresh={() => selectedProgramId && loadParticipants(selectedProgramId)}
                  refreshedAt={refreshedAt}
                  loading={loading}
                />

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as SortKey)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="health_score">Sort: Health Score</option>
                        <option value="compliance">Sort: Compliance</option>
                        <option value="plants_count">Sort: Plant Count</option>
                        <option value="last_log_date">Sort: Last Active</option>
                      </select>

                      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setViewMode('tiers')}
                          className={`p-2 ${viewMode === 'tiers' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={`p-2 ${viewMode === 'table' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {(['excellent', 'good', 'needs_attention'] as const).map((t) => {
                        const colors = {
                          excellent: tierFilters.excellent ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200',
                          good: tierFilters.good ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-400 border-gray-200',
                          needs_attention: tierFilters.needs_attention ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-50 text-gray-400 border-gray-200',
                        };
                        const labels = { excellent: 'Top', good: 'Mid', needs_attention: 'Low' };
                        return (
                          <button
                            key={t}
                            onClick={() => setTierFilters(f => ({ ...f, [t]: !f[t] }))}
                            className={`px-2.5 py-1 text-xs font-semibold border rounded-full transition-colors ${colors[t]}`}
                          >
                            {labels[t]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {viewMode === 'tiers' ? (
                  <div className="space-y-3">
                    <TierSection tier="excellent" participants={excellent} onSelectParticipant={setSelectedParticipant} />
                    <TierSection tier="good" participants={good} onSelectParticipant={setSelectedParticipant} />
                    <TierSection tier="needs_attention" participants={needsAttention} onSelectParticipant={setSelectedParticipant} />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Participant</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Score</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Compliance</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plants</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Logs</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Last Active</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Streak</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filtered.map((p) => (
                            <tr
                              key={p.user_id}
                              onClick={() => setSelectedParticipant(p)}
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <ParticipantAvatar avatarUrl={p.avatar_url} displayName={p.display_name} size="sm" />
                                  <div>
                                    <p className="font-semibold text-gray-900">{p.display_name || 'Unnamed'}</p>
                                    <p className="text-xs text-gray-400">{p.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-900">{p.health_score}</td>
                              <td className="px-4 py-3">
                                <span className={`font-bold ${
                                  p.compliance >= 80 ? 'text-green-600' : p.compliance >= 50 ? 'text-amber-600' : 'text-red-600'
                                }`}>{p.compliance}%</span>
                              </td>
                              <td className="px-4 py-3 text-gray-700">{p.plants_count}</td>
                              <td className="px-4 py-3 text-gray-700">{p.logs_count}/{p.expected_logs}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                                {p.last_log_date
                                  ? new Date(p.last_log_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                                  : 'Never'}
                              </td>
                              <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">{p.current_streak}d</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <MonitorReports
                participants={participants}
                period={reportPeriod}
                onPeriodChange={setReportPeriod}
              />
            )}

            {activeTab === 'leaderboard' && (
              <TopPerformers
                participants={participants}
                onSelectParticipant={setSelectedParticipant}
                onSendAppreciation={(p) => setAppreciationTarget([p])}
                onSendBulkAppreciation={(ps) => setAppreciationTarget(ps)}
                period={reportPeriod}
              />
            )}

            {activeTab === 'support' && (
              <SupportRequired
                participants={participants}
                onSelectParticipant={setSelectedParticipant}
                onSendEncouragement={(p, urgency) => setEncouragementTarget({ participant: p, urgency })}
              />
            )}
          </>
        )}
      </div>

      {selectedParticipant && (
        <ParticipantDetail
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}

      {appreciationTarget && selectedProgramId && (
        <AppreciationModal
          recipients={appreciationTarget}
          programId={selectedProgramId}
          period={reportPeriod}
          onClose={() => setAppreciationTarget(null)}
          onSent={() => setAppreciationTarget(null)}
        />
      )}

      {encouragementTarget && selectedProgramId && (
        <EncourageModal
          recipientUserId={encouragementTarget.participant.user_id}
          recipientName={encouragementTarget.participant.display_name || 'Participant'}
          programId={selectedProgramId}
          programName={programs.find(p => p.id === selectedProgramId)?.name || 'Program'}
          urgencyLevel={encouragementTarget.urgency}
          onClose={() => setEncouragementTarget(null)}
          onSent={() => {
            setEncouragementTarget(null);
            loadParticipants(selectedProgramId);
          }}
        />
      )}
    </div>
  );
}
