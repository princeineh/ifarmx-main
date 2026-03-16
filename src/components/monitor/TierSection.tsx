import { useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, TrendingUp, AlertTriangle, Sprout, Calendar, Timer } from 'lucide-react';
import { ParticipantAvatar } from './ParticipantAvatar';
import type { ParticipantStats } from './types';

interface TierSectionProps {
  tier: 'excellent' | 'good' | 'needs_attention';
  participants: ParticipantStats[];
  onSelectParticipant: (p: ParticipantStats) => void;
}

const tierConfig = {
  excellent: {
    label: 'Top Performers',
    icon: Trophy,
    headerBg: 'bg-green-600',
    badgeBg: 'bg-green-500',
    rowHover: 'hover:bg-green-50',
  },
  good: {
    label: 'Doing Great',
    icon: TrendingUp,
    headerBg: 'bg-amber-500',
    badgeBg: 'bg-amber-400',
    rowHover: 'hover:bg-amber-50',
  },
  needs_attention: {
    label: 'Needs Assistance',
    icon: AlertTriangle,
    headerBg: 'bg-red-500',
    badgeBg: 'bg-red-400',
    rowHover: 'hover:bg-red-50',
  },
};

const stageOrder = ['harvest', 'fruiting', 'flowering', 'transplant', 'nursery'];

function formatStage(stage: string | null): string {
  if (!stage) return 'N/A';
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function TierSection({ tier, participants, onSelectParticipant }: TierSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const config = tierConfig[tier];
  const Icon = config.icon;

  const sorted = [...participants].sort((a, b) => b.health_score - a.health_score);

  if (sorted.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`${config.headerBg} w-full px-5 py-3 flex items-center justify-between text-white`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="font-semibold text-sm">{config.label}</span>
          <span className={`${config.badgeBg} px-2 py-0.5 rounded-full text-xs font-bold`}>
            {sorted.length}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="divide-y divide-gray-100">
          {sorted.map((p) => (
            <button
              key={p.user_id}
              onClick={() => onSelectParticipant(p)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left ${config.rowHover} transition-colors`}
            >
              <ParticipantAvatar avatarUrl={p.avatar_url} displayName={p.display_name} size="md" />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {p.display_name || 'Unnamed Farmer'}
                </p>
                <p className="text-xs text-gray-500 truncate">{p.email}</p>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-600">
                <div className="text-center">
                  <p className="font-bold text-gray-900">{p.health_score}</p>
                  <p className="text-gray-400">Score</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">{p.plants_count}</p>
                  <p className="text-gray-400">Plants</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Timer className="w-3 h-3 text-emerald-500" />
                    <p className="font-bold text-gray-900">{p.days_in_program}d</p>
                  </div>
                  <p className="text-gray-400">Plant Age</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Sprout className="w-3 h-3 text-emerald-500" />
                    <p className="font-bold text-gray-900">{formatStage(p.highest_stage)}</p>
                  </div>
                  <p className="text-gray-400">Stage</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <p className="font-bold text-gray-900">
                      {p.last_log_date ? new Date(p.last_log_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Never'}
                    </p>
                  </div>
                  <p className="text-gray-400">Last Active</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${
                  p.compliance >= 80 ? 'text-green-600' :
                  p.compliance >= 50 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {p.compliance}%
                </span>
                {tier === 'needs_attention' && p.weakest_area && (
                  <span className="hidden lg:inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                    Low {p.weakest_area}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
