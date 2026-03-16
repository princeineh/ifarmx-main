import { useState } from 'react';
import {
  Trophy, Medal, Star, Crown, Send, ChevronRight,
  Flame, Droplets, Target
} from 'lucide-react';
import { ParticipantAvatar } from './ParticipantAvatar';
import type { ParticipantStats } from './types';

interface TopPerformersProps {
  participants: ParticipantStats[];
  onSelectParticipant: (p: ParticipantStats) => void;
  onSendAppreciation: (participant: ParticipantStats, isBulk: false) => void;
  onSendBulkAppreciation: (participants: ParticipantStats[]) => void;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

const medalColors = {
  1: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', ring: 'ring-amber-300' },
  2: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-400', ring: 'ring-gray-300' },
  3: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-400', ring: 'ring-orange-300' },
};

export function TopPerformers({ participants, onSelectParticipant, onSendAppreciation, onSendBulkAppreciation, period }: TopPerformersProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sorted = [...participants]
    .sort((a, b) => b.health_score - a.health_score);

  const top10 = sorted.slice(0, 10);
  const topPerformers = sorted.filter(p => p.status === 'excellent');

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllTop = () => {
    if (selectedIds.size === topPerformers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(topPerformers.map(p => p.user_id)));
    }
  };

  const handleBulkSend = () => {
    const selected = topPerformers.filter(p => selectedIds.has(p.user_id));
    if (selected.length > 0) {
      onSendBulkAppreciation(selected);
      setSelectedIds(new Set());
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No participant data yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {top10.length >= 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              Top 3 Leaderboard
            </h3>
            <span className="text-xs text-gray-400 capitalize">{period} ranking</span>
          </div>

          <div className="flex items-end justify-center gap-3 sm:gap-6 pb-2">
            {[1, 0, 2].map((idx) => {
              const p = top10[idx];
              if (!p) return null;
              const rank = idx + 1;
              const colors = medalColors[rank as keyof typeof medalColors];
              const isFirst = rank === 1;

              return (
                <button
                  key={p.user_id}
                  onClick={() => onSelectParticipant(p)}
                  className={`flex flex-col items-center gap-2 transition-transform hover:scale-105 ${isFirst ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'}`}
                >
                  <div className="relative">
                    {isFirst && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Crown className="w-5 h-5 text-amber-400" />
                      </div>
                    )}
                    <div className={`ring-3 ${colors.ring} rounded-full`}>
                      <ParticipantAvatar
                        avatarUrl={p.avatar_url}
                        displayName={p.display_name}
                        size={isFirst ? 'lg' : 'md'}
                      />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${colors.bg} ${colors.border} border rounded-full flex items-center justify-center`}>
                      <span className={`text-xs font-bold ${colors.icon}`}>{rank}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-gray-900 truncate max-w-[100px] ${isFirst ? 'text-sm' : 'text-xs'}`}>
                      {p.display_name || 'Unnamed'}
                    </p>
                    <p className={`font-bold ${
                      p.health_score >= 70 ? 'text-green-600' : 'text-amber-600'
                    } ${isFirst ? 'text-lg' : 'text-sm'}`}>
                      {p.health_score}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] text-gray-500">{p.current_streak}d streak</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-green-600" />
              Top Performers ({topPerformers.length})
            </h3>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkSend}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  Appreciate {selectedIds.size} Selected
                </button>
              )}
              <button
                onClick={selectAllTop}
                className="text-xs text-emerald-600 font-semibold hover:text-emerald-700"
              >
                {selectedIds.size === topPerformers.length ? 'Deselect All' : 'Select All Top'}
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {top10.map((p, idx) => {
            const rank = idx + 1;
            const isSelected = selectedIds.has(p.user_id);

            return (
              <div
                key={p.user_id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-emerald-50/50' : ''
                }`}
              >
                {p.status === 'excellent' && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(p.user_id)}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 flex-shrink-0"
                  />
                )}
                {p.status !== 'excellent' && <div className="w-4 flex-shrink-0" />}

                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className="text-xs font-bold">{rank}</span>
                </div>

                <ParticipantAvatar avatarUrl={p.avatar_url} displayName={p.display_name} size="sm" />

                <button
                  onClick={() => onSelectParticipant(p)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.display_name || 'Unnamed'}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{p.plants_count} plants</span>
                    <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                    <span>{p.current_streak}d streak</span>
                    <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                    <span>{p.compliance}% compliance</span>
                  </div>
                </button>

                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <div className="text-center">
                    <p className={`font-bold ${
                      p.health_score >= 70 ? 'text-green-600' : p.health_score >= 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>{p.health_score}</p>
                    <p className="text-gray-400">Score</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Droplets className="w-3 h-3 text-sky-400" />
                    <span className="font-bold text-gray-700">{p.watering_score}%</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendAppreciation(p, false);
                  }}
                  className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  title="Send appreciation"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold hidden sm:inline">Appreciate</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
