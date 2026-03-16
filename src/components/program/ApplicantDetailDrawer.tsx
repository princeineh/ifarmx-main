import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  X, Mail, MapPin, Calendar, Briefcase, Sprout, Droplets, Leaf,
  Bug, Scissors, TreePine, Loader2, Globe, Flame, Target,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Camera,
  Send, Heart
} from 'lucide-react';

interface ApplicantDetailDrawerProps {
  userId: string;
  displayName: string | null;
  email: string;
  stateOfOrigin: string | null;
  lga: string | null;
  location: string | null;
  dateOfBirth: string | null;
  occupation: string | null;
  appliedAt: string;
  isPlatformUser: boolean;
  hasPlants: boolean;
  onClose: () => void;
  onSendEncouragement: (userId: string, name: string) => void;
}

interface PlantStat {
  id: string;
  name: string;
  stage: string;
  planted_date: string;
  program_name: string;
}

interface CareLogStat {
  id: string;
  log_date: string;
  watered: boolean;
  fertilized: boolean;
  weeded: boolean;
  pruned: boolean;
  pest_checked: boolean;
  notes: string | null;
  issue_report: string | null;
  photo_url: string | null;
  plant_name: string;
}

interface ApplicantFarmingData {
  programCount: number;
  programNames: string[];
  plants: PlantStat[];
  totalLogs: number;
  recentLogs: CareLogStat[];
  wateringDays30: number;
  activeDays30: number;
  currentStreak: number;
  fertCount30: number;
  weedCount30: number;
  pestCount30: number;
  issueCount: number;
  overallCompliance: number;
}

const stageIcons: Record<string, string> = {
  nursery: '🌱', transplant: '🪴', flowering: '🌸', fruiting: '🍈', harvest: '🌾',
};

function getAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

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
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

export function ApplicantDetailDrawer({
  userId, displayName, email, stateOfOrigin, lga, location,
  dateOfBirth, occupation, appliedAt, isPlatformUser, hasPlants,
  onClose, onSendEncouragement,
}: ApplicantDetailDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApplicantFarmingData | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const age = getAge(dateOfBirth);

  useEffect(() => {
    loadFarmingData();
  }, [userId]);

  const loadFarmingData = async () => {
    setLoading(true);

    const [participantsRes, plantsRes] = await Promise.all([
      supabase
        .from('program_participants')
        .select('program_id, programs(name)')
        .eq('user_id', userId),
      supabase
        .from('plants')
        .select('id, name, stage, planted_date, program_id, programs(name)')
        .eq('user_id', userId),
    ]);

    const participations = participantsRes.data || [];
    const programNames = participations.map((p: any) => p.programs?.name || 'Program').filter(Boolean);

    const plants: PlantStat[] = (plantsRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      stage: p.stage,
      planted_date: p.planted_date,
      program_name: p.programs?.name || 'Independent',
    }));

    let recentLogs: CareLogStat[] = [];
    let totalLogs = 0;
    let wateringDays30 = 0;
    let activeDays30 = 0;
    let currentStreak = 0;
    let fertCount30 = 0;
    let weedCount30 = 0;
    let pestCount30 = 0;
    let issueCount = 0;
    let overallCompliance = 0;

    if (plants.length > 0) {
      const plantIds = plants.map(p => p.id);
      const plantNameMap: Record<string, string> = {};
      plants.forEach(p => { plantNameMap[p.id] = p.name; });

      const { data: logs, count } = await supabase
        .from('care_logs')
        .select('*', { count: 'exact' })
        .in('plant_id', plantIds)
        .order('log_date', { ascending: false })
        .limit(100);

      const allLogs = logs || [];
      totalLogs = count || allLogs.length;

      recentLogs = allLogs.slice(0, 15).map((l: any) => ({
        id: l.id,
        log_date: l.log_date,
        watered: l.watered,
        fertilized: l.fertilized,
        weeded: l.weeded,
        pruned: l.pruned,
        pest_checked: l.pest_checked,
        notes: l.notes,
        issue_report: l.issue_report,
        photo_url: l.photo_url,
        plant_name: plantNameMap[l.plant_id] || 'Unknown',
      }));

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recent30 = allLogs.filter((l: any) => new Date(l.log_date) >= thirtyDaysAgo);
      activeDays30 = new Set(recent30.map((l: any) => l.log_date)).size;
      wateringDays30 = new Set(recent30.filter((l: any) => l.watered).map((l: any) => l.log_date)).size;
      fertCount30 = recent30.filter((l: any) => l.fertilized).length;
      weedCount30 = recent30.filter((l: any) => l.weeded).length;
      pestCount30 = recent30.filter((l: any) => l.pest_checked).length;
      issueCount = allLogs.filter((l: any) => l.issue_report).length;

      overallCompliance = Math.min(Math.round((activeDays30 / 30) * 100), 100);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const logDateSet = new Set(allLogs.map((l: any) => l.log_date));
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (logDateSet.has(dateStr)) currentStreak++;
        else break;
      }
    }

    setData({
      programCount: participations.length,
      programNames,
      plants,
      totalLogs,
      recentLogs,
      wateringDays30,
      activeDays30,
      currentStreak,
      fertCount30,
      weedCount30,
      pestCount30,
      issueCount,
      overallCompliance,
    });
    setLoading(false);
  };

  const wateringPct = data ? Math.min(Math.round((data.wateringDays30 / 30) * 100), 100) : 0;
  const fertPct = data ? Math.min(Math.round((data.fertCount30 / 30) * 100), 100) : 0;
  const weedPct = data ? Math.min(Math.round((data.weedCount30 / 30) * 100), 100) : 0;
  const pestPct = data ? Math.min(Math.round((data.pestCount30 / 30) * 100), 100) : 0;

  const isStruggling = data && (data.overallCompliance < 40 || data.activeDays30 < 5);
  const displayLogs = showAllLogs ? (data?.recentLogs || []) : (data?.recentLogs || []).slice(0, 5);

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
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">
                {(displayName || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">
                {displayName || 'Unknown User'}
              </h2>
              {email && (
                <div className="flex items-center gap-1.5 mt-1 text-emerald-200 text-sm">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {isPlatformUser && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-200 rounded-full text-xs font-semibold">
                    Active Platform User
                  </span>
                )}
                {hasPlants && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-200 rounded-full text-xs font-semibold">
                    Has Plants
                  </span>
                )}
                {stateOfOrigin && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded-full text-xs text-white/90">
                    <MapPin className="w-3 h-3" /> {stateOfOrigin}{lga ? `, ${lga}` : ''}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-emerald-200/80">
                {age && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {age} years old
                  </span>
                )}
                {occupation && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {occupation}
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {location}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-300/70 mt-2">
                Applied {new Date(appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Loading farming history...</p>
              </div>
            </div>
          ) : !data ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-sm">Could not load farming data.</p>
            </div>
          ) : (
            <>
              {isStruggling && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">This applicant may need support</p>
                        <p className="text-xs text-red-600 mt-0.5">
                          Low activity ({data.activeDays30} active days) and {data.overallCompliance}% compliance in the last 30 days
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onSendEncouragement(userId, displayName || 'Farmer')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors flex-shrink-0"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Encourage
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Farming Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Globe className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{data.programCount}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Programs</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Sprout className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{data.plants.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Plants</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">{data.totalLogs}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total Logs</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${
                      data.overallCompliance >= 70 ? 'text-green-600' : data.overallCompliance >= 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>{data.overallCompliance}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">Compliance</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{data.activeDays30}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Active Days (30d)</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <p className="text-2xl font-bold text-gray-900">{data.currentStreak}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Day Streak</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{data.issueCount}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Issues Reported</p>
                  </div>
                </div>
              </div>

              {data.programNames.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Enrolled Programs</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.programNames.map((name, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                        <Globe className="w-3 h-3" />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Care Performance (30 Days)</h3>
                <div className="space-y-3">
                  <ScoreBar
                    label={`Watering (${data.wateringDays30} days)`}
                    value={wateringPct}
                    icon={<Droplets className="w-4 h-4 text-sky-500" />}
                  />
                  <ScoreBar
                    label={`Fertilizing (${data.fertCount30} times)`}
                    value={fertPct}
                    icon={<Leaf className="w-4 h-4 text-green-500" />}
                  />
                  <ScoreBar
                    label={`Weeding (${data.weedCount30} times)`}
                    value={weedPct}
                    icon={<Scissors className="w-4 h-4 text-amber-500" />}
                  />
                  <ScoreBar
                    label={`Pest Monitoring (${data.pestCount30} times)`}
                    value={pestPct}
                    icon={<Bug className="w-4 h-4 text-red-500" />}
                  />
                </div>
              </div>

              {data.plants.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Plant Inventory</h3>
                  <div className="bg-gray-50 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Plant</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Stage</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">Program</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Age</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.plants.map((plant) => {
                          const daysGrowing = Math.floor((Date.now() - new Date(plant.planted_date).getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <tr key={plant.id}>
                              <td className="px-3 py-2 font-medium text-gray-900">{plant.name}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1">
                                  <span>{stageIcons[plant.stage] || ''}</span>
                                  <span className="text-gray-700 capitalize">{plant.stage}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-500 text-xs hidden sm:table-cell">{plant.program_name}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">{daysGrowing}d</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {data.recentLogs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Care Logs</h3>
                  <div className="space-y-2">
                    {displayLogs.map((log) => (
                      <div key={log.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-gray-900">
                            {new Date(log.log_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-gray-400">{log.plant_name}</span>
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
                          <button onClick={() => setExpandedPhoto(log.photo_url)} className="mt-2 block">
                            <img src={log.photo_url} alt="Care log" className="rounded-lg w-full max-w-[200px] h-24 object-cover hover:opacity-90 transition-opacity" />
                          </button>
                        )}
                      </div>
                    ))}
                    {(data.recentLogs.length) > 5 && (
                      <button
                        onClick={() => setShowAllLogs(!showAllLogs)}
                        className="w-full py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1"
                      >
                        {showAllLogs ? (
                          <>Show Less <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>Show All {data.recentLogs.length} Logs <ChevronDown className="w-4 h-4" /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!isPlatformUser && data.plants.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <Sprout className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-amber-800">New to Farming</p>
                  <p className="text-xs text-amber-600 mt-1">
                    This applicant hasn't started farming on the platform yet. They may be a first-time user.
                  </p>
                </div>
              )}

              <div className="sticky bottom-0 bg-white border-t border-gray-100 -mx-6 px-6 py-4 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {data.plants.length} plants | {data.totalLogs} logs | {data.programCount} programs
                </div>
                {isStruggling && (
                  <button
                    onClick={() => onSendEncouragement(userId, displayName || 'Farmer')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold hover:bg-rose-200 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send Encouragement
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {expandedPhoto && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setExpandedPhoto(null)}>
          <img src={expandedPhoto} alt="Full size" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          <button onClick={() => setExpandedPhoto(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
