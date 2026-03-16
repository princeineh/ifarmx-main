import { useState } from 'react';
import { Award, Trophy, Star, Share2, Check, Flame, Target, TrendingUp } from 'lucide-react';
import type { Plant, CareLog } from '../../types/database';

interface WeeklyAchievementProps {
  plants: Plant[];
  weeklyLogs: CareLog[];
  displayName: string;
}

const WATERING_GOAL = 5;

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

function getWateredDaysCount(logs: CareLog[]): number {
  const weekStartStr = getWeekStartStr();
  const wateredDays = new Set<number>();
  for (const log of logs) {
    if (!log.watered) continue;
    const logDateStr = log.log_date.slice(0, 10);
    if (logDateStr >= weekStartStr) {
      wateredDays.add(getDayIndex(logDateStr));
    }
  }
  return wateredDays.size;
}

function getCareScore(logs: CareLog[]): number {
  const weekStartStr = getWeekStartStr();
  const thisWeek = logs.filter(l => l.log_date.slice(0, 10) >= weekStartStr);
  const fertilized = thisWeek.filter(l => l.fertilized).length;
  const weeded = thisWeek.filter(l => l.weeded).length;
  const pestChecked = thisWeek.filter(l => l.pest_checked).length;
  const waterCount = getWateredDaysCount(logs);
  const waterScore = Math.min(waterCount / WATERING_GOAL, 1) * 60;
  const careBonus = Math.min((fertilized + weeded + pestChecked) / 3, 1) * 40;
  return Math.round(waterScore + careBonus);
}

type MedalTier = 'gold' | 'silver' | 'bronze';

function getMedalTier(score: number): MedalTier {
  if (score >= 80) return 'gold';
  if (score >= 60) return 'silver';
  return 'bronze';
}

const medalConfig: Record<MedalTier, {
  gradient: string;
  border: string;
  bg: string;
  ring: string;
  text: string;
  label: string;
  icon: typeof Trophy;
}> = {
  gold: {
    gradient: 'from-amber-400 via-yellow-300 to-amber-500',
    border: 'border-amber-300',
    bg: 'from-amber-50 via-yellow-50 to-orange-50',
    ring: 'ring-amber-200',
    text: 'text-amber-800',
    label: 'Gold Champion',
    icon: Trophy,
  },
  silver: {
    gradient: 'from-gray-300 via-gray-100 to-gray-400',
    border: 'border-gray-300',
    bg: 'from-gray-50 via-slate-50 to-gray-100',
    ring: 'ring-gray-200',
    text: 'text-gray-700',
    label: 'Silver Achiever',
    icon: Award,
  },
  bronze: {
    gradient: 'from-orange-400 via-orange-300 to-amber-600',
    border: 'border-orange-300',
    bg: 'from-orange-50 via-amber-50 to-yellow-50',
    ring: 'ring-orange-200',
    text: 'text-orange-800',
    label: 'Bronze Grower',
    icon: Star,
  },
};

const celebrationMessages = [
  { title: 'Outstanding dedication!', body: 'Your plants are thriving because of your consistent care. You are setting the standard for palm oil farming!' },
  { title: 'You are a natural!', body: 'Week after week, you show up for your plants. This kind of commitment turns seedlings into harvests.' },
  { title: 'Farming excellence!', body: 'Your weekly target is smashed! Your palm trees are growing stronger with every care session.' },
  { title: 'Champion farmer!', body: 'Consistent watering is the foundation of great yields. You have nailed it this week!' },
  { title: 'Keep this energy!', body: 'Your dedication is paying off. Healthy plants mean a profitable harvest ahead.' },
];

const encouragementMessages = [
  { threshold: 4, message: 'Almost there! Just one more watering day to earn your weekly medal.' },
  { threshold: 3, message: 'Good progress! Two more watering days and you will earn a medal this week.' },
  { threshold: 2, message: 'You are building momentum. Keep watering to unlock your weekly achievement!' },
  { threshold: 1, message: 'Great start this week! Stay consistent and earn your first medal.' },
];

export function WeeklyAchievement({ plants, weeklyLogs, displayName }: WeeklyAchievementProps) {
  const [copied, setCopied] = useState(false);

  if (plants.length === 0) return null;

  const wateredDays = getWateredDaysCount(weeklyLogs);
  const hitTarget = wateredDays >= WATERING_GOAL;
  const score = getCareScore(weeklyLogs);
  const tier = getMedalTier(score);
  const config = medalConfig[tier];
  const MedalIcon = config.icon;

  const celebration = celebrationMessages[Math.floor(Date.now() / 86400000) % celebrationMessages.length];

  const handleShare = async () => {
    const shareText = `I just earned a ${config.label} medal on iFarmX! ${wateredDays}/${WATERING_GOAL} watering days this week with a ${score}% health score. Growing palm trees and building a sustainable future!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${config.label} - iFarmX`,
          text: shareText,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (hitTarget) {
    return (
      <div className={`rounded-2xl border-2 ${config.border} overflow-hidden shadow-lg slide-up`}>
        <div className={`bg-gradient-to-br ${config.bg} relative`}>
          <div className="absolute top-3 left-4 confetti-float" style={{ animationDelay: '0s' }}>
            <Star className="w-4 h-4 text-amber-400/40" />
          </div>
          <div className="absolute top-6 right-6 confetti-float" style={{ animationDelay: '0.5s' }}>
            <Star className="w-3 h-3 text-emerald-400/40" />
          </div>
          <div className="absolute bottom-8 left-8 confetti-float" style={{ animationDelay: '1s' }}>
            <Star className="w-3.5 h-3.5 text-orange-400/30" />
          </div>
          <div className="absolute top-12 left-1/3 confetti-float" style={{ animationDelay: '1.5s' }}>
            <Star className="w-2.5 h-2.5 text-yellow-500/30" />
          </div>

          <div className="px-6 pt-6 pb-5 relative">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg medal-bounce medal-shine ring-4 ${config.ring} flex-shrink-0`}>
                <MedalIcon className="w-8 h-8 text-white drop-shadow-sm" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>
                    {config.label}
                  </span>
                  <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full font-semibold text-gray-600">
                    {score}% score
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {celebration.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {celebration.body}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Weekly Target</p>
                  <p className="text-sm font-bold text-emerald-700">{wateredDays}/{WATERING_GOAL} Days Hit</p>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Health Score</p>
                  <p className="text-sm font-bold text-emerald-700">{score}%</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleShare}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : `bg-gradient-to-r ${config.gradient} text-white hover:shadow-md hover:scale-[1.01] active:scale-[0.99]`
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied to clipboard!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share Your Achievement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const encouragement = encouragementMessages.find(e => wateredDays >= e.threshold);
  if (!encouragement || wateredDays === 0) return null;

  const progress = (wateredDays / WATERING_GOAL) * 100;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-200 overflow-hidden slide-up">
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-sm">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Weekly Challenge</p>
            <p className="text-xs text-gray-500">Water 5 days to earn a medal</p>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700">{wateredDays} of {WATERING_GOAL} days</span>
          <span className="text-xs font-bold text-amber-700">{WATERING_GOAL - wateredDays} to go</span>
        </div>
        <div className="w-full bg-white rounded-full h-3 shadow-inner">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-700 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 rounded-full shimmer" />
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
          {encouragement.message}
        </p>
      </div>
    </div>
  );
}
