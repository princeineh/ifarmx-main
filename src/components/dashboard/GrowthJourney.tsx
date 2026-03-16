import { Sprout, Sun, Flower2, TreePine, Award, Timer, Calendar } from 'lucide-react';
import type { Plant, PlantStage } from '../../types/database';

interface GrowthJourneyProps {
  plants: Plant[];
}

const stages: { key: PlantStage; label: string; icon: typeof Sprout; color: string; bg: string; description: string }[] = [
  { key: 'nursery', label: 'Nursery', icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-500', description: 'Seeds germinating' },
  { key: 'transplant', label: 'Transplant', icon: Sun, color: 'text-amber-600', bg: 'bg-amber-500', description: 'Moving to soil' },
  { key: 'flowering', label: 'Flowering', icon: Flower2, color: 'text-orange-600', bg: 'bg-orange-500', description: 'Flowers appearing' },
  { key: 'fruiting', label: 'Fruiting', icon: TreePine, color: 'text-red-600', bg: 'bg-red-500', description: 'Fruits forming' },
  { key: 'harvest', label: 'Harvest', icon: Award, color: 'text-yellow-700', bg: 'bg-yellow-500', description: 'Ready to harvest!' },
];

function getHighestStageIndex(plants: Plant[]): number {
  if (plants.length === 0) return -1;
  let highest = -1;
  for (const plant of plants) {
    const idx = stages.findIndex(s => s.key === plant.stage);
    if (idx > highest) highest = idx;
  }
  return highest;
}

function getStageCounts(plants: Plant[]): Record<string, number> {
  return plants.reduce((acc, plant) => {
    acc[plant.stage] = (acc[plant.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function getPlantAgeSummary(plants: Plant[]): { oldest: number; newest: number; avgLabel: string } | null {
  if (plants.length === 0) return null;
  const ages = plants.map(p => Math.floor((Date.now() - new Date(p.planted_date).getTime()) / (1000 * 60 * 60 * 24)));
  const oldest = Math.max(...ages);
  const newest = Math.min(...ages);
  const avg = Math.round(ages.reduce((s, a) => s + a, 0) / ages.length);
  if (avg < 7) return { oldest, newest, avgLabel: `${avg} day${avg !== 1 ? 's' : ''}` };
  if (avg < 30) return { oldest, newest, avgLabel: `${Math.floor(avg / 7)} week${Math.floor(avg / 7) !== 1 ? 's' : ''}` };
  const months = Math.floor(avg / 30);
  return { oldest, newest, avgLabel: `${months} month${months !== 1 ? 's' : ''}` };
}

export function GrowthJourney({ plants }: GrowthJourneyProps) {
  const highestIdx = getHighestStageIndex(plants);
  const stageCounts = getStageCounts(plants);
  const progressPercent = plants.length === 0 ? 0 : ((highestIdx + 1) / stages.length) * 100;
  const ageSummary = getPlantAgeSummary(plants);
  const oldestPlant = plants.length > 0
    ? plants.reduce((a, b) => new Date(a.planted_date) < new Date(b.planted_date) ? a : b)
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-md border-4 kente-border overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 via-green-50 to-amber-50 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">Growth Journey</h2>
          {plants.length > 0 && (
            <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              {Math.round(progressPercent)}% Complete
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {plants.length === 0
            ? 'Activate a kit to begin your palm oil journey'
            : `${stages[highestIdx]?.description} - your palm trees are growing!`}
        </p>
        {ageSummary && oldestPlant && (
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-emerald-200">
              <Timer className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800">
                {ageSummary.oldest} day{ageSummary.oldest !== 1 ? 's' : ''} since activation
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-amber-200">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-800">
                Planted {new Date(oldestPlant.planted_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-2">
        <div className="relative">
          <div className="absolute top-5 left-5 right-5 h-1.5 bg-gray-200 rounded-full" />
          <div
            className="absolute top-5 left-5 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-1000"
            style={{ width: `calc(${progressPercent}% - 40px)` }}
          />

          <div className="relative flex justify-between">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isReached = idx <= highestIdx;
              const isCurrent = idx === highestIdx;
              const count = stageCounts[stage.key] || 0;

              return (
                <div key={stage.key} className="flex flex-col items-center" style={{ width: '20%' }}>
                  <div className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                    ${isCurrent ? `${stage.bg} stage-pulse shadow-lg` : isReached ? stage.bg : 'bg-gray-200'}
                  `}>
                    <Icon className={`w-5 h-5 ${isReached ? 'text-white' : 'text-gray-400'}`} />
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-white border-2 border-emerald-500 rounded-full text-[10px] font-bold text-emerald-700 flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold mt-2 ${isReached ? 'text-gray-900' : 'text-gray-400'}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {highestIdx >= 0 && highestIdx < stages.length - 1 && (
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-green-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                {(() => {
                  const NextIcon = stages[highestIdx + 1].icon;
                  return <NextIcon className="w-4 h-4 text-amber-700" />;
                })()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Next: {stages[highestIdx + 1].label} Stage
                </p>
                <p className="text-xs text-gray-600">
                  {stages[highestIdx + 1].description} - keep caring for your plants!
                </p>
              </div>
            </div>
          </div>
        )}

        {highestIdx === stages.length - 1 && (
          <div className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-yellow-800" />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-900">Harvest Ready!</p>
                <p className="text-xs text-yellow-800">Your palm trees have reached full maturity. Time to reap the rewards!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
