import {
  Sprout, Users, Droplets, Heart, Activity,
  ArrowUpRight, ArrowDownRight, Key
} from 'lucide-react';
import type { PlatformSummary } from './types';

interface MonitorStatsProps {
  summary: PlatformSummary;
}

export function MonitorStats({ summary }: MonitorStatsProps) {
  const activationRate = summary.kits_total > 0
    ? Math.round((summary.kits_activated / summary.kits_total) * 100)
    : 0;

  const healthDist = summary.health_distribution;
  const totalHealthUsers = healthDist.thriving + healthDist.healthy + healthDist.needs_attention + healthDist.at_risk + healthDist.critical;
  const doingWell = healthDist.thriving + healthDist.healthy;
  const needsHelp = healthDist.needs_attention + healthDist.at_risk + healthDist.critical;
  const doingWellPct = totalHealthUsers > 0 ? Math.round((doingWell / totalHealthUsers) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Plants"
          value={summary.total_active_plants}
          icon={Sprout}
          color="from-emerald-500 to-emerald-700"
          sub={`${summary.total_users_with_plants} growers`}
        />
        <StatCard
          label="Avg. Health"
          value={`${Math.round(summary.avg_health_score)}%`}
          icon={Heart}
          color={summary.avg_health_score >= 60 ? 'from-green-500 to-green-700' : 'from-amber-500 to-amber-700'}
          sub={`${summary.avg_watering_days.toFixed(1)} water days/wk`}
        />
        <StatCard
          label="Care Logs (Week)"
          value={summary.total_care_logs_week}
          icon={Activity}
          color="from-blue-500 to-blue-700"
          sub={`${summary.total_care_logs_all} total all time`}
        />
        <StatCard
          label="Kit Activation"
          value={`${activationRate}%`}
          icon={Key}
          color="from-teal-500 to-teal-700"
          sub={`${summary.kits_activated}/${summary.kits_total} activated`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            Health Overview
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">{doingWellPct}%</p>
              <p className="text-[10px] text-gray-500 font-medium">Doing Well</p>
            </div>
            <div className="flex-1 h-12 flex items-center">
              <div className="w-full bg-gray-100 rounded-full h-3 flex overflow-hidden">
                {totalHealthUsers > 0 && (
                  <>
                    <div className="bg-emerald-500 h-full" style={{ width: `${(healthDist.thriving / totalHealthUsers) * 100}%` }} />
                    <div className="bg-green-400 h-full" style={{ width: `${(healthDist.healthy / totalHealthUsers) * 100}%` }} />
                    <div className="bg-amber-400 h-full" style={{ width: `${(healthDist.needs_attention / totalHealthUsers) * 100}%` }} />
                    <div className="bg-orange-400 h-full" style={{ width: `${(healthDist.at_risk / totalHealthUsers) * 100}%` }} />
                    <div className="bg-red-400 h-full" style={{ width: `${(healthDist.critical / totalHealthUsers) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <HealthRow label="Thriving" count={healthDist.thriving} total={totalHealthUsers} color="bg-emerald-500" />
            <HealthRow label="Healthy" count={healthDist.healthy} total={totalHealthUsers} color="bg-green-400" />
            <HealthRow label="Needs Attention" count={healthDist.needs_attention} total={totalHealthUsers} color="bg-amber-400" />
            <HealthRow label="At Risk" count={healthDist.at_risk} total={totalHealthUsers} color="bg-orange-400" />
            <HealthRow label="Critical" count={healthDist.critical} total={totalHealthUsers} color="bg-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-500" />
            Growth Stages
          </h3>
          <div className="space-y-3">
            {(['nursery', 'transplant', 'flowering', 'fruiting', 'harvest'] as const).map(stage => {
              const count = summary.stage_distribution[stage];
              const pct = summary.total_active_plants > 0 ? (count / summary.total_active_plants) * 100 : 0;
              const labels: Record<string, { label: string; color: string }> = {
                nursery: { label: 'Nursery', color: 'from-lime-400 to-lime-500' },
                transplant: { label: 'Transplant', color: 'from-green-400 to-green-500' },
                flowering: { label: 'Flowering', color: 'from-yellow-400 to-yellow-500' },
                fruiting: { label: 'Fruiting', color: 'from-orange-400 to-orange-500' },
                harvest: { label: 'Harvest', color: 'from-emerald-500 to-emerald-600' },
              };
              const s = labels[stage];
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                    <span className="text-[10px] text-gray-500">{count} plants ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${s.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            By User Type
          </h3>
          <div className="space-y-4">
            {(['individual', 'family', 'organization'] as const).map(type => {
              const data = summary.type_breakdown[type];
              const colors: Record<string, string> = {
                individual: 'from-emerald-500 to-emerald-600',
                family: 'from-blue-500 to-blue-600',
                organization: 'from-amber-500 to-amber-600',
              };
              return (
                <div key={type} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800 capitalize">{type}</span>
                    <span className="text-[10px] text-gray-500">{data.count} grower{data.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[type]} rounded-full`}
                        style={{ width: `${data.avg_health}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${data.avg_health >= 60 ? 'text-emerald-600' : data.avg_health >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {Math.round(data.avg_health)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string;
  value: number | string;
  icon: typeof Sprout;
  color: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function HealthRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
      <span className="text-[11px] text-gray-600 flex-1">{label}</span>
      <span className="text-[11px] font-semibold text-gray-800">{count}</span>
      <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
}
