import { useState } from 'react';
import {
  X, Mail, MapPin, Calendar, Clock, Sprout, Droplets, Leaf,
  Bug, Scissors, Target, Flame, Award, TreePine, AlertTriangle,
  ChevronDown, ChevronUp, Camera, CheckCircle, XCircle, Timer
} from 'lucide-react';
import { ParticipantAvatar } from './ParticipantAvatar';
import type { ParticipantStats } from './types';

interface ParticipantDetailProps {
  participant: ParticipantStats;
  onClose: () => void;
}

const stageIcons: Record<string, string> = {
  nursery: '🌱',
  transplant: '🪴',
  flowering: '🌸',
  fruiting: '🍈',
  harvest: '🌾',
};

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ScoreBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-400' : 'bg-red-400';
  const textColor = value >= 70 ? 'text-green-700' : value >= 40 ? 'text-amber-700' : 'text-red-700';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function ParticipantDetail({ participant: p, onClose }: ParticipantDetailProps) {
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const displayLogs = showAllLogs ? p.recent_logs : p.recent_logs.slice(0, 8);

  const medalConfig = {
    gold: { label: 'Gold Champion', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', icon: '🥇' },
    silver: { label: 'Silver Achiever', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', icon: '🥈' },
    bronze: { label: 'Bronze Grower', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', icon: '🥉' },
    none: { label: 'No Medal', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', icon: '--' },
  };
  const medal = medalConfig[p.medal];

  const fertPct = p.expected_logs > 0 ? Math.round((p.fertilizing_count_month / Math.max(p.expected_logs, 1)) * 100) : 0;
  const weedPct = p.expected_logs > 0 ? Math.round((p.weeding_count_month / Math.max(p.expected_logs, 1)) * 100) : 0;
  const pestPct = p.expected_logs > 0 ? Math.round((p.pest_count_month / Math.max(p.expected_logs, 1)) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in">
        <div className="sticky top-0 z-10 bg-gradient-to-br from-emerald-700 via-emerald-800 to-amber-900 px-6 pt-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <ParticipantAvatar avatarUrl={p.avatar_url} displayName={p.display_name} size="xl" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">
                {p.display_name || 'Unnamed Farmer'}
              </h2>
              <div className="flex items-center gap-1.5 mt-1 text-emerald-200 text-sm">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{p.email}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-white/15 rounded-full text-xs font-semibold text-white">
                  {p.user_type === 'individual' ? 'Individual' : p.user_type === 'family' ? 'Family / Group' : 'Organization'}
                </span>
                {p.region_vibe && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded-full text-xs text-white/90">
                    <MapPin className="w-3 h-3" /> {p.region_vibe}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  p.participant_status === 'active' ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'
                }`}>
                  {p.participant_status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-emerald-200/80">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Joined {new Date(p.joined_program_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {p.plants.length > 0 && (
                  <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
                    <Timer className="w-3 h-3" />
                    Plant age: {p.plants[0].days_growing} day{p.plants[0].days_growing !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Performance Facts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${
                  p.compliance >= 80 ? 'text-green-600' : p.compliance >= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>{p.compliance}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Compliance</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{p.health_score}<span className="text-sm text-gray-400">/100</span></p>
                <p className="text-xs text-gray-500 mt-0.5">Health Score</p>
              </div>
              <div className={`${medal.bg} border ${medal.border} rounded-xl p-3 text-center`}>
                <p className="text-lg">{medal.icon}</p>
                <p className={`text-xs font-semibold ${medal.text} mt-0.5`}>{medal.label}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{p.plants_count}</p>
                <p className="text-xs text-gray-500 mt-0.5">Active Plants</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{p.logs_count}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Logs</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{p.active_days_30}</p>
                <p className="text-xs text-gray-500 mt-0.5">Active Days (30d)</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <p className="text-2xl font-bold text-gray-900">{p.current_streak}</p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Day Streak</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{p.days_in_program}</p>
                <p className="text-xs text-gray-500 mt-0.5">Days in Program</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Care Breakdown</h3>
            <div className="space-y-3">
              <div>
                <ScoreBar
                  label="Watering"
                  value={p.watering_score}
                  icon={<Droplets className="w-4 h-4 text-sky-500" />}
                />
                <div className="flex items-center gap-1 mt-1.5">
                  {p.watering_days_this_week.map((watered, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        watered ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {dayLabels[i][0]}
                      </div>
                    </div>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">this week</span>
                </div>
              </div>

              <ScoreBar
                label={`Fertilizing (${p.fertilizing_count_week}/wk, ${p.fertilizing_count_month}/mo)`}
                value={fertPct}
                icon={<Leaf className="w-4 h-4 text-green-500" />}
              />
              <ScoreBar
                label={`Weeding (${p.weeding_count_week}/wk, ${p.weeding_count_month}/mo)`}
                value={weedPct}
                icon={<Scissors className="w-4 h-4 text-amber-500" />}
              />
              <ScoreBar
                label={`Pest Monitoring (${p.pest_count_week}/wk, ${p.pest_count_month}/mo)`}
                value={pestPct}
                icon={<Bug className="w-4 h-4 text-red-500" />}
              />

              <div className="flex items-center gap-3 text-xs mt-2">
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <Target className="w-3.5 h-3.5" /> Strongest: {p.strongest_area}
                </span>
                <span className="flex items-center gap-1 text-red-500 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Weakest: {p.weakest_area}
                </span>
              </div>
            </div>
          </div>

          {p.plants.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Plant Inventory</h3>
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Plant</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Stage</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">Activated</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Age (days)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {p.plants.map((plant) => (
                      <tr key={plant.id}>
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-gray-900">{plant.name}</p>
                            {plant.farming_type !== 'individual' && (
                              <p className="text-xs text-gray-400">{plant.group_name || plant.farming_type}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1">
                            <span>{stageIcons[plant.stage] || ''}</span>
                            <span className="text-gray-700 capitalize">{plant.stage}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 hidden sm:table-cell">
                          {new Date(plant.planted_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{plant.days_growing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {p.recent_logs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Care Activity</h3>
              <div className="space-y-2">
                {displayLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-xs font-semibold text-gray-900">
                          {new Date(log.log_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">{log.plant_name}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {log.watered && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-[10px] font-semibold">
                          <Droplets className="w-2.5 h-2.5" /> Watered
                        </span>
                      )}
                      {log.fertilized && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold">
                          <Leaf className="w-2.5 h-2.5" /> Fertilized
                        </span>
                      )}
                      {log.weeded && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold">
                          <Scissors className="w-2.5 h-2.5" /> Weeded
                        </span>
                      )}
                      {log.pruned && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-semibold">
                          <TreePine className="w-2.5 h-2.5" /> Pruned
                        </span>
                      )}
                      {log.pest_checked && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-semibold">
                          <Bug className="w-2.5 h-2.5" /> Pest Check
                        </span>
                      )}
                    </div>
                    {log.notes && <p className="text-xs text-gray-600 mt-1">{log.notes}</p>}
                    {log.issue_report && (
                      <p className="text-xs text-red-600 font-medium mt-1 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {log.issue_report}
                      </p>
                    )}
                    {log.photo_url && (
                      <button
                        onClick={() => setExpandedPhoto(log.photo_url)}
                        className="mt-2 block"
                      >
                        <img
                          src={log.photo_url}
                          alt="Care log"
                          className="rounded-lg w-full max-w-[200px] h-24 object-cover hover:opacity-90 transition-opacity"
                        />
                      </button>
                    )}
                  </div>
                ))}
                {p.recent_logs.length > 8 && (
                  <button
                    onClick={() => setShowAllLogs(!showAllLogs)}
                    className="w-full py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1"
                  >
                    {showAllLogs ? (
                      <>Show Less <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Show All {p.recent_logs.length} Logs <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {p.issue_reports.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Reported Issues ({p.issue_reports.length})
              </h3>
              <div className="space-y-2">
                {p.issue_reports.map((issue) => (
                  <div key={issue.id} className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-red-800">
                        {new Date(issue.log_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-red-600">{issue.plant_name}</span>
                    </div>
                    <p className="text-sm text-red-900">{issue.issue_report}</p>
                    {issue.photo_url && (
                      <button
                        onClick={() => setExpandedPhoto(issue.photo_url)}
                        className="mt-2 block"
                      >
                        <img
                          src={issue.photo_url}
                          alt="Issue"
                          className="rounded-lg w-full max-w-[200px] h-24 object-cover hover:opacity-90 transition-opacity"
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {expandedPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          <img
            src={expandedPhoto}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          <button
            onClick={() => setExpandedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
