import {
  AlertTriangle, Clock, Droplets, Bug, Send, ChevronRight,
  Phone, Mail, Calendar
} from 'lucide-react';
import { ParticipantAvatar } from './ParticipantAvatar';
import type { ParticipantStats } from './types';

interface SupportRequiredProps {
  participants: ParticipantStats[];
  onSelectParticipant: (p: ParticipantStats) => void;
  onSendEncouragement: (p: ParticipantStats, urgency: 'critical' | 'warning' | 'mild') => void;
}

function getDaysSinceLastLog(lastLogDate: string | null): number | null {
  if (!lastLogDate) return null;
  const now = new Date();
  const last = new Date(lastLogDate);
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyLevel(p: ParticipantStats): 'critical' | 'warning' | 'mild' {
  const daysSince = getDaysSinceLastLog(p.last_log_date);
  if (daysSince === null || daysSince > 14) return 'critical';
  if (p.compliance < 30 || p.health_score < 25) return 'critical';
  if (daysSince > 7 || p.compliance < 50) return 'warning';
  return 'mild';
}

const urgencyConfig = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500 text-white', label: 'Critical' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500 text-white', label: 'Warning' },
  mild: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500 text-white', label: 'Mild' },
};

export function SupportRequired({ participants, onSelectParticipant, onSendEncouragement }: SupportRequiredProps) {
  const needsHelp = participants
    .filter(p => p.status === 'needs_attention')
    .map(p => ({ ...p, urgency: getUrgencyLevel(p) }))
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, mild: 2 };
      return order[a.urgency] - order[b.urgency];
    });

  const critical = needsHelp.filter(p => p.urgency === 'critical');
  const warning = needsHelp.filter(p => p.urgency === 'warning');
  const mild = needsHelp.filter(p => p.urgency === 'mild');

  const inactiveCount = participants.filter(p => {
    const d = getDaysSinceLastLog(p.last_log_date);
    return d === null || d > 7;
  }).length;

  const issueCount = participants.reduce((s, p) => s + p.issue_reports.length, 0);
  const lowWateringCount = participants.filter(p => p.watering_score < 30).length;

  if (needsHelp.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-green-100 p-8 text-center">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-7 h-7 text-green-500" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">All Participants Are On Track</h3>
        <p className="text-sm text-gray-500">No one currently needs additional support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs text-red-600 font-semibold mb-1">Need Support</p>
          <p className="text-2xl font-bold text-red-700">{needsHelp.length}</p>
          <p className="text-[10px] text-red-500 mt-0.5">of {participants.length} total</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <p className="text-xs text-gray-600 font-semibold">Inactive 7d+</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{inactiveCount}</p>
        </div>
        <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
          <div className="flex items-center gap-1 mb-1">
            <Droplets className="w-3 h-3 text-sky-500" />
            <p className="text-xs text-sky-600 font-semibold">Low Watering</p>
          </div>
          <p className="text-2xl font-bold text-sky-700">{lowWateringCount}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-center gap-1 mb-1">
            <Bug className="w-3 h-3 text-orange-500" />
            <p className="text-xs text-orange-600 font-semibold">Open Issues</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{issueCount}</p>
        </div>
      </div>

      {[
        { list: critical, label: 'Critical', config: urgencyConfig.critical },
        { list: warning, label: 'Needs Attention', config: urgencyConfig.warning },
        { list: mild, label: 'Mild Concern', config: urgencyConfig.mild },
      ].map(({ list, label, config }) => {
        if (list.length === 0) return null;
        return (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-4 py-2.5 ${config.bg} ${config.border} border-b flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-current opacity-70" />
                <span className="text-sm font-bold">{label}</span>
                <span className={`${config.badge} px-2 py-0.5 rounded-full text-[10px] font-bold`}>{list.length}</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {list.map((p) => {
                const daysSince = getDaysSinceLastLog(p.last_log_date);
                return (
                  <div
                    key={p.user_id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <ParticipantAvatar avatarUrl={p.avatar_url} displayName={p.display_name} size="sm" />

                    <button
                      onClick={() => onSelectParticipant(p)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.display_name || 'Unnamed'}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {daysSince !== null && daysSince > 3 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-600">
                            <Clock className="w-2.5 h-2.5" /> {daysSince}d inactive
                          </span>
                        )}
                        {daysSince === null && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 rounded text-[10px] font-medium text-red-600">
                            <Clock className="w-2.5 h-2.5" /> Never logged
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          p.compliance < 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {p.compliance}% compliance
                        </span>
                        {p.issue_reports.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-orange-100 rounded text-[10px] font-medium text-orange-700">
                            {p.issue_reports.length} issue{p.issue_reports.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500">
                          Weak: {p.weakest_area}
                        </span>
                      </div>
                    </button>

                    <div className="hidden sm:block text-center text-xs">
                      <p className={`font-bold ${
                        p.health_score < 30 ? 'text-red-600' : 'text-amber-600'
                      }`}>{p.health_score}</p>
                      <p className="text-gray-400">Score</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendEncouragement(p, p.urgency);
                      }}
                      className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors flex-shrink-0"
                      title="Send encouragement"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold hidden sm:inline">Encourage</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
