import { useState } from 'react';
import { Sprout, Sun, Flower2, TreePine, Award, ChevronRight, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import type { Plant, PlantStage } from '../../types/database';

interface PlantCardsProps {
  plants: Plant[];
  onSelectPlant: (plant: Plant) => void;
}

const VISIBLE_COUNT = 3;

const stageConfig: Record<PlantStage, {
  label: string;
  icon: typeof Sprout;
  gradient: string;
  badge: string;
  border: string;
}> = {
  nursery: {
    label: 'Nursery',
    icon: Sprout,
    gradient: 'from-emerald-50 to-green-100',
    badge: 'bg-emerald-100 text-emerald-800',
    border: 'border-emerald-200 hover:border-emerald-400',
  },
  transplant: {
    label: 'Transplant',
    icon: Sun,
    gradient: 'from-amber-50 to-yellow-100',
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-amber-200 hover:border-amber-400',
  },
  flowering: {
    label: 'Flowering',
    icon: Flower2,
    gradient: 'from-orange-50 to-amber-100',
    badge: 'bg-orange-100 text-orange-800',
    border: 'border-orange-200 hover:border-orange-400',
  },
  fruiting: {
    label: 'Fruiting',
    icon: TreePine,
    gradient: 'from-red-50 to-orange-100',
    badge: 'bg-red-100 text-red-800',
    border: 'border-red-200 hover:border-red-400',
  },
  harvest: {
    label: 'Harvest',
    icon: Award,
    gradient: 'from-yellow-50 to-amber-100',
    badge: 'bg-yellow-100 text-yellow-800',
    border: 'border-yellow-300 hover:border-yellow-500',
  },
};

function getPlantAge(dateStr: string): { days: number; label: string } {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return { days, label: 'Planted today' };
  if (days < 7) return { days, label: `${days} day${days !== 1 ? 's' : ''} old` };
  const weeks = Math.floor(days / 7);
  if (days < 30) return { days, label: `${weeks} week${weeks !== 1 ? 's' : ''} old` };
  const months = Math.floor(days / 30);
  const remainDays = days % 30;
  if (months < 12) return { days, label: `${months} month${months !== 1 ? 's' : ''}${remainDays > 0 ? `, ${remainDays}d` : ''} old` };
  const years = Math.floor(days / 365);
  const remainMonths = Math.floor((days % 365) / 30);
  return { days, label: `${years} year${years !== 1 ? 's' : ''}${remainMonths > 0 ? `, ${remainMonths}mo` : ''} old` };
}

export function PlantCards({ plants, onSelectPlant }: PlantCardsProps) {
  const [expanded, setExpanded] = useState(false);

  if (plants.length === 0) return null;

  const hasMore = plants.length > VISIBLE_COUNT;
  const visiblePlants = expanded ? plants : plants.slice(0, VISIBLE_COUNT);
  const hiddenCount = plants.length - VISIBLE_COUNT;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Your Palm Trees
          <span className="text-sm font-normal text-gray-500 ml-2">({plants.length})</span>
        </h2>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {expanded ? (
              <><span>Show Less</span><ChevronUp className="w-4 h-4" /></>
            ) : (
              <><span>View All ({plants.length})</span><ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePlants.map((plant) => {
          const config = stageConfig[plant.stage];
          const Icon = config.icon;
          const age = getPlantAge(plant.planted_date);

          return (
            <button
              key={plant.id}
              onClick={() => onSelectPlant(plant)}
              className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-5 text-left border-2 ${config.border} transition-all hover:shadow-lg group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{plant.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Timer className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700">{age.label}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({age.days}d)</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 float-slow">
                  <Icon className={`w-6 h-6 ${config.badge.split(' ')[1]}`} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.badge}`}>
                    {config.label}
                  </span>
                  {plant.land_volunteer && (
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      Land Volunteer
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full mt-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 rounded-xl border border-gray-200 hover:border-emerald-200 transition-all"
        >
          +{hiddenCount} more palm tree{hiddenCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
