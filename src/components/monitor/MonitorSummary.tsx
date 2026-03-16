import { Trophy, TrendingUp, AlertTriangle, Users, RefreshCw } from 'lucide-react';
import type { ParticipantStats } from './types';

interface MonitorSummaryProps {
  participants: ParticipantStats[];
  onRefresh: () => void;
  refreshedAt: Date | null;
  loading: boolean;
}

export function MonitorSummary({ participants, onRefresh, refreshedAt, loading }: MonitorSummaryProps) {
  const total = participants.length;
  const excellent = participants.filter(p => p.status === 'excellent').length;
  const good = participants.filter(p => p.status === 'good').length;
  const needsAttention = participants.filter(p => p.status === 'needs_attention').length;
  const avgCompliance = total > 0
    ? Math.round(participants.reduce((sum, p) => sum + p.compliance, 0) / total)
    : 0;

  const excellentPct = total > 0 ? Math.round((excellent / total) * 100) : 0;
  const goodPct = total > 0 ? Math.round((good / total) * 100) : 0;
  const needsPct = total > 0 ? 100 - excellentPct - goodPct : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Exceptional</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{excellent}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Doing Great</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{good}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Needs Help</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{needsAttention}</p>
        </div>
      </div>

      {total > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Program Compliance</p>
                <p className="text-3xl font-bold text-gray-900">{avgCompliance}%</p>
              </div>
              <div className="w-14 h-14 relative">
                <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={avgCompliance >= 70 ? '#16a34a' : avgCompliance >= 40 ? '#d97706' : '#dc2626'}
                    strokeWidth="3"
                    strokeDasharray={`${avgCompliance * 0.94} 100`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {refreshedAt && (
                <span>Updated {refreshedAt.toLocaleTimeString()}</span>
              )}
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            {excellentPct > 0 && (
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${excellentPct}%` }}
              />
            )}
            {goodPct > 0 && (
              <div
                className="bg-amber-400 transition-all duration-500"
                style={{ width: `${goodPct}%` }}
              />
            )}
            {needsPct > 0 && (
              <div
                className="bg-red-400 transition-all duration-500"
                style={{ width: `${needsPct}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> {excellentPct}% Exceptional</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> {goodPct}% Doing Great</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> {needsPct}% Needs Help</span>
          </div>
        </div>
      )}
    </div>
  );
}
