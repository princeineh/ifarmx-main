import { useState, useMemo } from 'react';
import {
  Calendar, TrendingUp, TrendingDown, Droplets, Leaf,
  Scissors, Bug, BarChart3, Activity
} from 'lucide-react';
import type { ParticipantStats } from './types';

interface MonitorReportsProps {
  participants: ParticipantStats[];
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
}

const periods = [
  { key: 'daily' as const, label: 'Daily' },
  { key: 'weekly' as const, label: 'Weekly' },
  { key: 'monthly' as const, label: 'Monthly' },
  { key: 'yearly' as const, label: 'Yearly' },
];

function getPeriodLabel(period: string): string {
  const now = new Date();
  switch (period) {
    case 'daily':
      return now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    case 'weekly': {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - diff);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    case 'monthly':
      return now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    case 'yearly':
      return now.getFullYear().toString();
    default:
      return '';
  }
}

function MetricBar({ label, value, maxValue, color, icon }: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  icon: React.ReactNode;
}) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-bold text-gray-900">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${color}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function MonitorReports({ participants, period, onPeriodChange }: MonitorReportsProps) {
  const total = participants.length;

  const metrics = useMemo(() => {
    if (total === 0) return null;

    const avgHealth = Math.round(participants.reduce((s, p) => s + p.health_score, 0) / total);
    const avgCompliance = Math.round(participants.reduce((s, p) => s + p.compliance, 0) / total);
    const avgWatering = Math.round(participants.reduce((s, p) => s + p.watering_score, 0) / total);

    const avgFert = Math.round(participants.reduce((s, p) => s + p.fertilizing_count_month, 0) / total);
    const avgWeed = Math.round(participants.reduce((s, p) => s + p.weeding_count_month, 0) / total);
    const avgPest = Math.round(participants.reduce((s, p) => s + p.pest_count_month, 0) / total);

    const avgStreak = Math.round(participants.reduce((s, p) => s + p.current_streak, 0) / total);
    const avgActiveDays = Math.round(participants.reduce((s, p) => s + p.active_days_30, 0) / total);
    const totalPlants = participants.reduce((s, p) => s + p.plants_count, 0);
    const totalLogs = participants.reduce((s, p) => s + p.logs_count, 0);

    const excellent = participants.filter(p => p.status === 'excellent').length;
    const good = participants.filter(p => p.status === 'good').length;
    const needsAttention = participants.filter(p => p.status === 'needs_attention').length;

    const stageDistribution: Record<string, number> = {};
    participants.forEach(p => {
      if (p.highest_stage) {
        stageDistribution[p.highest_stage] = (stageDistribution[p.highest_stage] || 0) + 1;
      }
    });

    const weakAreas: Record<string, number> = {};
    participants.forEach(p => {
      weakAreas[p.weakest_area] = (weakAreas[p.weakest_area] || 0) + 1;
    });
    const topWeakArea = Object.entries(weakAreas).sort((a, b) => b[1] - a[1])[0];

    const strongAreas: Record<string, number> = {};
    participants.forEach(p => {
      strongAreas[p.strongest_area] = (strongAreas[p.strongest_area] || 0) + 1;
    });
    const topStrongArea = Object.entries(strongAreas).sort((a, b) => b[1] - a[1])[0];

    const issueCount = participants.reduce((s, p) => s + p.issue_reports.length, 0);
    const withIssues = participants.filter(p => p.issue_reports.length > 0).length;

    return {
      avgHealth, avgCompliance, avgWatering,
      avgFert, avgWeed, avgPest,
      avgStreak, avgActiveDays, totalPlants, totalLogs,
      excellent, good, needsAttention,
      stageDistribution,
      topWeakArea, topStrongArea,
      issueCount, withIssues,
    };
  }, [participants, total]);

  if (!metrics || total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No data available for reports.</p>
      </div>
    );
  }

  const stageLabels: Record<string, string> = {
    nursery: 'Nursery', transplant: 'Transplant', flowering: 'Flowering',
    fruiting: 'Fruiting', harvest: 'Harvest',
  };
  const stageColors: Record<string, string> = {
    nursery: 'bg-emerald-400', transplant: 'bg-sky-400', flowering: 'bg-pink-400',
    fruiting: 'bg-amber-400', harvest: 'bg-green-600',
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900">Report Period</h3>
          </div>
          <span className="text-xs text-gray-500">{getPeriodLabel(period)}</span>
        </div>
        <div className="flex items-center gap-1 mt-3">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                period === p.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-gray-500 font-medium">Avg Health</span>
          </div>
          <p className={`text-3xl font-bold ${
            metrics.avgHealth >= 70 ? 'text-green-600' : metrics.avgHealth >= 40 ? 'text-amber-600' : 'text-red-600'
          }`}>{metrics.avgHealth}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">out of 100</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-500 font-medium">Avg Compliance</span>
          </div>
          <p className={`text-3xl font-bold ${
            metrics.avgCompliance >= 70 ? 'text-green-600' : metrics.avgCompliance >= 40 ? 'text-amber-600' : 'text-red-600'
          }`}>{metrics.avgCompliance}%</p>
          <p className="text-[10px] text-gray-400 mt-0.5">log frequency</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-gray-500 font-medium">Avg Streak</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.avgStreak}<span className="text-sm text-gray-400">d</span></p>
          <p className="text-[10px] text-gray-400 mt-0.5">consecutive days</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 font-medium">Issues</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{metrics.issueCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">from {metrics.withIssues} participants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Care Activity Breakdown</h4>
          <div className="space-y-4">
            <MetricBar
              label="Watering"
              value={metrics.avgWatering}
              maxValue={100}
              color="bg-sky-500"
              icon={<Droplets className="w-4 h-4 text-sky-500" />}
            />
            <MetricBar
              label="Fertilizing"
              value={metrics.avgFert}
              maxValue={Math.max(metrics.avgFert, 10)}
              color="bg-green-500"
              icon={<Leaf className="w-4 h-4 text-green-500" />}
            />
            <MetricBar
              label="Weeding"
              value={metrics.avgWeed}
              maxValue={Math.max(metrics.avgWeed, 10)}
              color="bg-amber-500"
              icon={<Scissors className="w-4 h-4 text-amber-500" />}
            />
            <MetricBar
              label="Pest Monitoring"
              value={metrics.avgPest}
              maxValue={Math.max(metrics.avgPest, 10)}
              color="bg-red-500"
              icon={<Bug className="w-4 h-4 text-red-500" />}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-green-600 font-semibold mb-0.5">Strongest Area</p>
              <p className="text-sm font-bold text-green-800">
                {metrics.topStrongArea ? `${metrics.topStrongArea[0]} (${metrics.topStrongArea[1]})` : 'N/A'}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-xs text-red-600 font-semibold mb-0.5">Weakest Area</p>
              <p className="text-sm font-bold text-red-800">
                {metrics.topWeakArea ? `${metrics.topWeakArea[0]} (${metrics.topWeakArea[1]})` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Participant Distribution</h4>

          <div className="space-y-3 mb-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Top Performers
                </span>
                <span className="text-sm font-bold text-green-700">
                  {metrics.excellent} <span className="text-gray-400 font-normal">({total > 0 ? Math.round((metrics.excellent / total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${total > 0 ? (metrics.excellent / total) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Average
                </span>
                <span className="text-sm font-bold text-amber-700">
                  {metrics.good} <span className="text-gray-400 font-normal">({total > 0 ? Math.round((metrics.good / total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${total > 0 ? (metrics.good / total) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Support Required
                </span>
                <span className="text-sm font-bold text-red-700">
                  {metrics.needsAttention} <span className="text-gray-400 font-normal">({total > 0 ? Math.round((metrics.needsAttention / total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${total > 0 ? (metrics.needsAttention / total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          <h4 className="text-sm font-bold text-gray-900 mb-3">Growth Stage Distribution</h4>
          <div className="flex items-end gap-2 h-24">
            {['nursery', 'transplant', 'flowering', 'fruiting', 'harvest'].map((stage) => {
              const count = metrics.stageDistribution[stage] || 0;
              const maxStage = Math.max(...Object.values(metrics.stageDistribution), 1);
              const heightPct = (count / maxStage) * 100;
              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-700">{count}</span>
                  <div className="w-full rounded-t-md relative" style={{ height: `${Math.max(heightPct, 4)}%` }}>
                    <div className={`absolute inset-0 ${stageColors[stage] || 'bg-gray-300'} rounded-t-md`} />
                  </div>
                  <span className="text-[9px] text-gray-500 font-medium truncate w-full text-center">
                    {stageLabels[stage]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{metrics.totalPlants}</p>
              <p className="text-[10px] text-gray-500">Total Plants</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{metrics.totalLogs}</p>
              <p className="text-[10px] text-gray-500">Total Logs</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{metrics.avgActiveDays}</p>
              <p className="text-[10px] text-gray-500">Avg Active Days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
