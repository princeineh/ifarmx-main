import { Droplets, Sprout, Scissors, Bug, Heart, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Plant, CareLog } from '../../types/database';

interface PlantHealthProps {
  plants: Plant[];
  weeklyLogs: CareLog[];
}

const WATERING_GOAL = 5;

function getWeekDays(): string[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days;
}

function getWeekStartStr(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function getDayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay();
  return dow === 0 ? 6 : dow - 1;
}

function getWateredDaysThisWeek(logs: CareLog[]): Set<number> {
  const weekStartStr = getWeekStartStr();
  const wateredDays = new Set<number>();

  for (const log of logs) {
    if (!log.watered) continue;
    const logDateStr = log.log_date.slice(0, 10);
    if (logDateStr >= weekStartStr) {
      wateredDays.add(getDayIndex(logDateStr));
    }
  }
  return wateredDays;
}

function getCareStats(logs: CareLog[]) {
  const weekStartStr = getWeekStartStr();
  const thisWeek = logs.filter(l => l.log_date.slice(0, 10) >= weekStartStr);

  return {
    watered: thisWeek.filter(l => l.watered).length,
    fertilized: thisWeek.filter(l => l.fertilized).length,
    weeded: thisWeek.filter(l => l.weeded).length,
    pestChecked: thisWeek.filter(l => l.pest_checked).length,
    totalLogs: thisWeek.length,
  };
}

function getHealthScore(waterCount: number, stats: ReturnType<typeof getCareStats>): number {
  const waterScore = Math.min(waterCount / WATERING_GOAL, 1) * 60;
  const careBonus = Math.min((stats.fertilized + stats.weeded + stats.pestChecked) / 3, 1) * 40;
  return Math.round(waterScore + careBonus);
}

function getHealthLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Thriving', color: 'text-emerald-700', bg: 'bg-emerald-500' };
  if (score >= 60) return { label: 'Healthy', color: 'text-green-700', bg: 'bg-green-500' };
  if (score >= 40) return { label: 'Needs Attention', color: 'text-amber-700', bg: 'bg-amber-500' };
  if (score >= 20) return { label: 'At Risk', color: 'text-orange-700', bg: 'bg-orange-500' };
  return { label: 'Critical', color: 'text-red-700', bg: 'bg-red-500' };
}

export function PlantHealth({ plants, weeklyLogs }: PlantHealthProps) {
  if (plants.length === 0) return null;

  const wateredDays = getWateredDaysThisWeek(weeklyLogs);
  const stats = getCareStats(weeklyLogs);
  const healthScore = getHealthScore(wateredDays.size, stats);
  const health = getHealthLabel(healthScore);
  const days = getWeekDays();
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-amber-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Plant Health</h2>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${healthScore >= 60 ? 'bg-emerald-100' : healthScore >= 40 ? 'bg-amber-100' : 'bg-red-100'}`}>
            {healthScore >= 60 ? (
              <CheckCircle2 className={`w-3.5 h-3.5 ${health.color}`} />
            ) : (
              <AlertTriangle className={`w-3.5 h-3.5 ${health.color}`} />
            )}
            <span className={`text-xs font-bold ${health.color}`}>{health.label}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-800">Weekly Watering</span>
            </div>
            <span className={`text-sm font-bold ${wateredDays.size >= WATERING_GOAL ? 'text-emerald-600' : wateredDays.size >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
              {wateredDays.size}/{WATERING_GOAL} days
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {days.map((day, idx) => {
              const isWatered = wateredDays.has(idx);
              const isToday = idx === todayIdx;
              const isFuture = idx > todayIdx;

              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-semibold ${isToday ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {day}
                  </span>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all
                    ${isWatered ? 'bg-blue-500 shadow-sm' : isFuture ? 'bg-gray-100 border border-dashed border-gray-300' : isToday ? 'bg-amber-100 border-2 border-amber-400' : 'bg-red-50 border border-red-200'}
                  `}>
                    {isWatered ? (
                      <Droplets className="w-3.5 h-3.5 text-white" />
                    ) : isToday && !isWatered ? (
                      <span className="text-[10px] font-bold text-amber-700">!</span>
                    ) : isFuture ? (
                      <span className="text-[10px] text-gray-400">-</span>
                    ) : (
                      <span className="text-[10px] text-red-400">X</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-0.5 w-full">
            {days.map((_, idx) => {
              const isPast = idx < todayIdx;
              const isToday = idx === todayIdx;
              const isFuture = idx > todayIdx;
              const isWatered = wateredDays.has(idx);

              return (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 transition-all duration-700 ${idx === 0 ? 'rounded-l-full' : ''} ${idx === 6 ? 'rounded-r-full' : ''} ${
                    isFuture
                      ? 'bg-gray-200'
                      : isWatered
                        ? 'bg-emerald-500'
                        : (isPast || isToday)
                          ? 'bg-red-400'
                          : 'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            {wateredDays.size >= WATERING_GOAL
              ? 'Great job! You hit your watering target this week.'
              : `Water ${WATERING_GOAL - wateredDays.size} more day${WATERING_GOAL - wateredDays.size !== 1 ? 's' : ''} this week to keep your plants healthy.`}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{stats.watered}</p>
            <p className="text-[10px] text-gray-500 font-medium">Watered</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <Sprout className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{stats.fertilized}</p>
            <p className="text-[10px] text-gray-500 font-medium">Fertilized</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <Scissors className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{stats.weeded}</p>
            <p className="text-[10px] text-gray-500 font-medium">Weeded</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <Bug className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{stats.pestChecked}</p>
            <p className="text-[10px] text-gray-500 font-medium">Pest Checks</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-gray-900">Health Score</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${health.bg}`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <span className={`text-lg font-bold ${health.color}`}>{healthScore}%</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Score based on watering (60%) + fertilizing, weeding & pest care (40%)
          </p>
        </div>
      </div>
    </div>
  );
}
