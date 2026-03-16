import { motion } from 'framer-motion';
import {
  Droplets, Sprout, Scissors, Bug, Heart, TreePine,
  TrendingUp, Crown, Flame, Wheat, Sparkles,
  Timer, Calendar, Target, AlertTriangle, Sun, Flower2, Award
} from 'lucide-react';
import type { Plant, CareLog, PlantStage } from '../../types/database';

// ─── Constants ──────────────────────────────────────────────────────────────

const SEEDS_PER_KIT = 3;

const STAGE_ORDER: PlantStage[] = ['nursery', 'transplant', 'flowering', 'fruiting', 'harvest'];
const STAGE_LABELS: Record<PlantStage, string> = {
  nursery: 'Nursery', transplant: 'Transplant', flowering: 'Flowering',
  fruiting: 'Fruiting', harvest: 'Harvest',
};
const STAGE_ICONS: Record<string, any> = {
  nursery: Sprout, transplant: Sun, flowering: Flower2,
  fruiting: TreePine, harvest: Award,
};

// ─── Helpers (exported for family panel) ────────────────────────────────────

export function getWeekStartStr(): string {
  const now = new Date();
  const dow = now.getDay();
  const diff = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

export function getWateredDaysCount(logs: CareLog[]): number {
  const ws = getWeekStartStr();
  const days = new Set<number>();
  for (const l of logs) {
    if (!l.watered || l.log_date.slice(0, 10) < ws) continue;
    const d = new Date(l.log_date).getDay();
    days.add(d === 0 ? 6 : d - 1);
  }
  return days.size;
}

export function getCareStats(logs: CareLog[]) {
  const ws = getWeekStartStr();
  const wk = logs.filter(l => l.log_date.slice(0, 10) >= ws);
  return {
    watered: wk.filter(l => l.watered).length,
    fertilized: wk.filter(l => l.fertilized).length,
    weeded: wk.filter(l => l.weeded).length,
    pestChecked: wk.filter(l => l.pest_checked).length,
    totalLogs: wk.length,
  };
}

export function getHealthScore(logs: CareLog[]): number {
  const s = getCareStats(logs);
  const w = Math.min(getWateredDaysCount(logs) / 5, 1) * 60;
  const c = Math.min((s.fertilized + s.weeded + s.pestChecked) / 3, 1) * 40;
  return Math.round(w + c);
}

function getHighestStage(plants: Plant[]): PlantStage {
  let hi = 0;
  for (const p of plants) {
    const idx = STAGE_ORDER.indexOf(p.stage);
    if (idx > hi) hi = idx;
  }
  return STAGE_ORDER[hi];
}

function getDaysActive(plants: Plant[]): number {
  if (!plants.length) return 0;
  const oldest = plants.reduce((a, b) =>
    new Date(a.planted_date) < new Date(b.planted_date) ? a : b
  );
  return Math.floor((Date.now() - new Date(oldest.planted_date).getTime()) / 86400000);
}

function getPlantedDate(plants: Plant[]): string | null {
  if (!plants.length) return null;
  const oldest = plants.reduce((a, b) =>
    new Date(a.planted_date) < new Date(b.planted_date) ? a : b
  );
  return new Date(oldest.planted_date).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getScoreColor(score: number) {
  if (score >= 80) return 'from-grove-500 to-grove-400';
  if (score >= 60) return 'from-green-500 to-green-400';
  if (score >= 40) return 'from-amber-500 to-amber-400';
  return 'from-red-500 to-red-400';
}

function getEncouragement(name: string, score: number): string {
  if (score >= 80) return `${name} is an outstanding farmer! Keep shining \u{1F31F}`;
  if (score >= 60) return `${name} is doing well \u2014 a little more care will make a big difference!`;
  if (score >= 40) return `${name}, your seeds need you \u2014 try to log more this week \u{1F331}`;
  if (score > 0) return `${name}, don\u2019t forget your seeds \u2014 every drop of water counts \u{1F4A7}`;
  return `${name}, start logging care to see your score grow!`;
}

function getStageProgress(stage: PlantStage): number {
  return ((STAGE_ORDER.indexOf(stage) + 1) / STAGE_ORDER.length) * 100;
}

// ─── Farmer type ────────────────────────────────────────────────────────────

export interface Farmer {
  name: string;
  isHead?: boolean;
  isCustodianChild?: boolean;
  seedCount: number;
  plantCount: number;
  healthScore: number;
  wateredDays: number;
  totalLogs: number;
  fertilized: number;
  weeded: number;
  pestChecked: number;
  issuesReported: number;
  highestStage: PlantStage;
  daysActive: number;
  plantedDate: string | null;
}

export function buildFarmer(
  name: string,
  plants: Plant[],
  logs: CareLog[],
  opts?: { isHead?: boolean; isCustodianChild?: boolean }
): Farmer {
  const stats = getCareStats(logs);
  const ws = getWeekStartStr();
  const weekLogs = logs.filter(l => l.log_date.slice(0, 10) >= ws);
  return {
    name,
    isHead: opts?.isHead,
    isCustodianChild: opts?.isCustodianChild,
    seedCount: plants.length * SEEDS_PER_KIT,
    plantCount: plants.length,
    healthScore: getHealthScore(logs),
    wateredDays: getWateredDaysCount(logs),
    totalLogs: stats.totalLogs,
    fertilized: stats.fertilized,
    weeded: stats.weeded,
    pestChecked: stats.pestChecked,
    issuesReported: weekLogs.filter(l => l.issue_report).length,
    highestStage: plants.length > 0 ? getHighestStage(plants) : 'nursery',
    daysActive: getDaysActive(plants),
    plantedDate: getPlantedDate(plants),
  };
}

// ─── Solo entry point ───────────────────────────────────────────────────────

interface SoloFarmStatsProps {
  displayName: string;
  plants: Plant[];
  weeklyLogs: CareLog[];
  kitCount: number;
  onBuyKit: () => void;
  onActivateKit: () => void;
}

export function SoloFarmStats({ displayName, plants, weeklyLogs, kitCount, onBuyKit, onActivateKit }: SoloFarmStatsProps) {
  if (plants.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#0a1a0e] via-[#0f2518] to-[#0a1a0e] px-5 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-grove-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Your Farm Stats</h2>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-grove-100 to-warmth-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-8 h-8 text-grove-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Begin Your Growing Journey</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
            Get the Oil Palm Starter Kit (3 seeds per kit). Every great farmer started with a single seed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={onBuyKit} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-warmth-500 to-warmth-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-warmth-600 hover:to-warmth-700 transition-all shadow-md text-sm">
              Buy a Kit
            </button>
            <button onClick={onActivateKit} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-grove-500 to-grove-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-grove-600 hover:to-grove-700 transition-all shadow-md text-sm">
              Activate a Kit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Build one Farmer per plant (each plant = 1 kit = 3 seeds)
  const farmers: Farmer[] = plants.map(plant => {
    const plantLogs = weeklyLogs.filter(l => l.plant_id === plant.id);
    return buildFarmer(plant.name, [plant], plantLogs);
  });

  return (
    <FarmStatsBoard
      farmers={farmers}
      title="Your Farm Stats"
      kitCount={kitCount}
      onBuyKit={onBuyKit}
      onActivateKit={onActivateKit}
    />
  );
}

// ─── Stat row definitions ───────────────────────────────────────────────────

interface StatRow {
  key: string;
  label: string;
  icon: any;
  getValue: (f: Farmer) => string;
  getNumeric: (f: Farmer) => number;
}

const statRows: StatRow[] = [
  { key: 'healthScore', label: 'CARE SCORE', icon: Heart,
    getValue: f => `${f.healthScore}%`, getNumeric: f => f.healthScore },
  { key: 'seedCount', label: 'SEEDS', icon: Wheat,
    getValue: f => `${f.seedCount}`, getNumeric: f => f.seedCount },
  { key: 'daysActive', label: 'DAYS ACTIVE', icon: Timer,
    getValue: f => `${f.daysActive}d`, getNumeric: f => f.daysActive },
  { key: 'wateredDays', label: 'WATERED DAYS', icon: Droplets,
    getValue: f => `${f.wateredDays}/7`, getNumeric: f => f.wateredDays },
  { key: 'totalLogs', label: 'LOGS THIS WEEK', icon: Target,
    getValue: f => `${f.totalLogs}`, getNumeric: f => f.totalLogs },
  { key: 'fertilized', label: 'FERTILIZED', icon: Sprout,
    getValue: f => `${f.fertilized}`, getNumeric: f => f.fertilized },
  { key: 'weeded', label: 'WEEDED', icon: Scissors,
    getValue: f => `${f.weeded}`, getNumeric: f => f.weeded },
  { key: 'pestChecked', label: 'PEST CHECKS', icon: Bug,
    getValue: f => `${f.pestChecked}`, getNumeric: f => f.pestChecked },
  { key: 'issuesReported', label: 'ISSUES', icon: AlertTriangle,
    getValue: f => `${f.issuesReported}`, getNumeric: f => f.issuesReported },
];

// ─── Main board ─────────────────────────────────────────────────────────────

interface FarmStatsBoardProps {
  farmers: Farmer[];
  title?: string;
  kitCount?: number;
  onBuyKit?: () => void;
  onActivateKit?: () => void;
}

export function FarmStatsBoard({
  farmers, title = 'Farm Stats', kitCount, onBuyKit, onActivateKit,
}: FarmStatsBoardProps) {
  const sorted = [...farmers].sort((a, b) => b.healthScore - a.healthScore);
  const isSolo = sorted.length === 1;
  const colCount = Math.min(sorted.length, 4);
  const gridCls = isSolo
    ? 'grid-cols-1'
    : sorted.length === 2
      ? 'grid-cols-2'
      : sorted.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-4';

  const totalSeeds = sorted.reduce((s, f) => s + f.seedCount, 0);
  const totalKits = sorted.reduce((s, f) => s + f.plantCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-md overflow-hidden"
    >
      {/* Dark header */}
      <div className="bg-gradient-to-r from-[#0a1a0e] via-[#0f2518] to-[#0a1a0e] px-5 py-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-grove-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
          <span className="text-[10px] text-grove-400/80 ml-auto uppercase tracking-wide">This Week</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-[10px] text-grove-300/80 font-medium">
            {totalKits} Kit{totalKits !== 1 ? 's' : ''} &middot; {totalSeeds} Seeds
            {kitCount != null && kitCount > 0 ? ` &middot; ${kitCount} Purchased` : ''}
          </span>
          {sorted[0]?.plantedDate && (
            <span className="text-[10px] text-grove-300/60 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Since {sorted[0].plantedDate}
            </span>
          )}
        </div>
      </div>

      {/* Avatars */}
      <div className="bg-gradient-to-b from-[#0f2518] to-[#0a1a0e] px-4 pb-4 pt-2">
        <div className={`grid gap-3 ${isSolo ? 'grid-cols-1 max-w-[200px] mx-auto' : gridCls}`}>
          {sorted.map((farmer, idx) => {
            const grad = getScoreColor(farmer.healthScore);
            const StageIcon = STAGE_ICONS[farmer.highestStage] || Sprout;
            return (
              <div key={farmer.name + idx} className="flex flex-col items-center">
                <div className="relative mb-1.5">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg shadow-grove-900/30 ring-2 ring-white/20`}>
                    <span className="text-lg sm:text-xl font-black text-white">{getInitials(farmer.name)}</span>
                  </div>
                  {idx === 0 && !isSolo && sorted.length > 1 && (
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-warmth-400 rounded-full flex items-center justify-center shadow-md">
                      <Crown className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  {farmer.isHead && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 bg-warmth-400/90 text-[8px] text-white font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">HEAD</div>
                  )}
                </div>
                <p className="text-xs font-bold text-white text-center truncate max-w-full">{farmer.name}</p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{farmer.healthScore}<span className="text-sm text-grove-400">%</span></p>
                <div className="flex items-center gap-1 mt-1 bg-white/10 rounded-full px-2 py-0.5">
                  <StageIcon className="w-3 h-3 text-grove-300" />
                  <span className="text-[10px] text-grove-200 font-semibold">{STAGE_LABELS[farmer.highestStage]}</span>
                </div>
                <p className="text-[10px] text-grove-300/60 mt-0.5">{farmer.seedCount} seeds &middot; {farmer.daysActive}d active</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Growth progress bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-grove-50/60 to-warmth-50/40 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Growth Journey</span>
          <span className="text-[10px] font-semibold text-grove-600">
            {Math.round(getStageProgress(sorted[0]?.highestStage || 'nursery'))}% Complete
          </span>
        </div>
        <div className="flex items-center gap-1">
          {STAGE_ORDER.map((stage, si) => {
            const anyReached = sorted.some(f => STAGE_ORDER.indexOf(f.highestStage) >= si);
            const Icon = STAGE_ICONS[stage];
            return (
              <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  anyReached ? 'bg-grove-500 shadow-sm' : 'bg-gray-200'
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${anyReached ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <span className={`text-[8px] font-semibold ${anyReached ? 'text-gray-700' : 'text-gray-400'}`}>
                  {STAGE_LABELS[stage]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stat rows */}
      <div className="divide-y divide-gray-100">
        {statRows.map(({ key, label, icon: Icon, getValue, getNumeric }) => (
          <div key={key} className="flex items-center">
            <div className="flex items-center gap-2 px-4 py-2.5 w-[130px] sm:w-[140px] flex-shrink-0 bg-gray-50">
              <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</span>
            </div>
            <div className={`flex-1 grid ${gridCls}`}>
              {sorted.map((farmer, idx) => {
                const num = getNumeric(farmer);
                const isTop = !isSolo && sorted.length > 1 && num === Math.max(...sorted.map(getNumeric)) && num > 0;
                const uniqueTop = isTop && sorted.filter(f => getNumeric(f) === num).length === 1;
                return (
                  <div key={farmer.name + idx} className={`flex items-center justify-center py-2.5 text-sm font-bold ${
                    isTop ? 'text-grove-700 bg-grove-50' : 'text-gray-800'
                  }`}>
                    {getValue(farmer)}
                    {uniqueTop && <Flame className="w-3 h-3 text-warmth-500 ml-1" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Encouragement */}
      <div className="px-4 py-3 bg-grove-50/60 border-t border-grove-100 space-y-1.5">
        {sorted.map((farmer, idx) => (
          <div key={farmer.name + idx} className="flex items-start gap-2">
            <Sparkles className="w-3 h-3 text-warmth-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-gray-700">{getEncouragement(farmer.name, farmer.healthScore)}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      {onBuyKit && onActivateKit && (
        <div className="flex gap-2 px-4 py-3 border-t border-gray-100 bg-white">
          <button onClick={onBuyKit} className="flex-1 text-xs font-semibold text-warmth-700 bg-warmth-50 hover:bg-warmth-100 px-3 py-2 rounded-lg transition-colors text-center">
            Buy Kit
          </button>
          <button onClick={onActivateKit} className="flex-1 text-xs font-semibold text-grove-700 bg-grove-50 hover:bg-grove-100 px-3 py-2 rounded-lg transition-colors text-center">
            Activate Kit
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gradient-to-r from-[#0a1a0e] to-[#0f2518] px-5 py-3 flex items-center justify-between">
        <span className="text-[10px] text-grove-500/80 uppercase tracking-wide font-semibold">iFarmX &middot; Plant With Patience</span>
        <span className="text-[10px] text-grove-500/60 font-medium">
          {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </motion.div>
  );
}
