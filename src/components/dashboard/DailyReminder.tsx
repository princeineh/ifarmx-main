import { useState } from 'react';
import { Bell, Droplets, Store, ArrowRight, ShieldCheck, CheckCircle, Loader2, Leaf, Scissors, Bug } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { createNotification } from '../../services/notifications';
import type { Plant, CareLog } from '../../types/database';

interface DailyReminderProps {
  plants: Plant[];
  weeklyLogs: CareLog[];
  onNavigate: (page: string) => void;
  onLogsUpdated?: () => void;
}

function hasWateredToday(logs: CareLog[]): boolean {
  const today = new Date().toISOString().split('T')[0];
  return logs.some(l => l.watered && l.log_date.startsWith(today));
}

function daysSinceLastCare(logs: CareLog[]): number {
  if (logs.length === 0) return 999;
  const sorted = [...logs].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
  return Math.floor((Date.now() - new Date(sorted[0].log_date).getTime()) / (1000 * 60 * 60 * 24));
}

function getPlantsNotLoggedToday(plants: Plant[], logs: CareLog[]): Plant[] {
  const today = new Date().toISOString().split('T')[0];
  const loggedPlantIds = new Set(
    logs.filter(l => l.log_date.startsWith(today)).map(l => l.plant_id)
  );
  return plants.filter(p => !loggedPlantIds.has(p.id));
}

const tradeCentreMessages = [
  { text: 'Healthy plants grow into profitable harvests. Visit Trade Centre to see what your palm oil can earn you.', emphasis: 'Your kit is your investment' },
  { text: 'Consistent care = higher yields = more income. The Trade Centre connects you to buyers for your harvest.', emphasis: 'Care today, sell tomorrow' },
  { text: 'Every watering session brings you closer to your first trade. Explore the marketplace for opportunities.', emphasis: 'From farm to market' },
  { text: 'Well-maintained palms produce premium oil. Premium oil fetches the best prices at the Trade Centre.', emphasis: 'Quality care = quality price' },
  { text: 'Your palm trees are a growing business. The Trade Centre is where your farming effort turns to real income.', emphasis: 'Growing your wealth' },
  { text: 'Other farmers are already listing their produce. Keep caring for your plants and join them at the Trade Centre.', emphasis: 'Join the community' },
  { text: 'Each care log you create builds your farming record. This helps buyers trust your produce on the marketplace.', emphasis: 'Build your reputation' },
];

const careActions = [
  { key: 'watered', label: 'Watered', icon: Droplets, activeBg: 'bg-sky-100 border-sky-400 text-sky-700', activeRing: 'ring-sky-200' },
  { key: 'fertilized', label: 'Fertilized', icon: Leaf, activeBg: 'bg-emerald-100 border-emerald-400 text-emerald-700', activeRing: 'ring-emerald-200' },
  { key: 'weeded', label: 'Weeded', icon: Scissors, activeBg: 'bg-amber-100 border-amber-400 text-amber-700', activeRing: 'ring-amber-200' },
  { key: 'pest_checked', label: 'Pest Check', icon: Bug, activeBg: 'bg-red-100 border-red-400 text-red-700', activeRing: 'ring-red-200' },
];

export function DailyReminder({ plants, weeklyLogs, onNavigate, onLogsUpdated }: DailyReminderProps) {
  const { user } = useAuth();
  const [bulkLogging, setBulkLogging] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Record<string, boolean>>({ watered: true });

  if (plants.length === 0) return null;

  const wateredToday = hasWateredToday(weeklyLogs);
  const daysSince = daysSinceLastCare(weeklyLogs);
  const todayMessage = tradeCentreMessages[Math.floor(Date.now() / 86400000) % tradeCentreMessages.length];
  const plantsNotLogged = getPlantsNotLoggedToday(plants, weeklyLogs);

  const isUrgent = daysSince >= 3;
  const needsWatering = !wateredToday;

  const toggleAction = (key: string) => {
    setSelectedActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBulkLog = async () => {
    if (!user || plantsNotLogged.length === 0) return;
    setBulkLogging(true);

    const today = new Date().toISOString().split('T')[0];
    const logRows = plantsNotLogged.map(plant => ({
      plant_id: plant.id,
      user_id: user.id,
      log_date: today,
      notes: null,
      issue_report: null,
      photo_url: null,
      watered: selectedActions.watered || false,
      fertilized: selectedActions.fertilized || false,
      weeded: selectedActions.weeded || false,
      pruned: false,
      pest_checked: selectedActions.pest_checked || false,
    }));

    const { error } = await supabase.from('care_logs').insert(logRows);

    setBulkLogging(false);
    if (!error) {
      setBulkDone(true);
      onLogsUpdated?.();

      const actions = Object.entries(selectedActions)
        .filter(([, v]) => v)
        .map(([k]) => k.replace('_', ' '))
        .join(', ');
      createNotification(
        user.id,
        'care_logged',
        'Daily Care Logged',
        `Great work! You logged care for ${logRows.length} plant${logRows.length !== 1 ? 's' : ''} today (${actions}). Consistency is the key to healthy plants and great harvests.`
      );
    }
  };

  const hasAnyAction = Object.values(selectedActions).some(Boolean);

  return (
    <div className="space-y-4">
      {needsWatering && !bulkDone && plantsNotLogged.length > 0 && (
        <div className={`rounded-2xl overflow-hidden shadow-md ${isUrgent ? 'border-2 border-red-300' : 'border border-amber-200'}`}>
          <div className={`px-6 py-4 ${isUrgent ? 'bg-gradient-to-r from-red-50 to-orange-50' : 'bg-gradient-to-r from-amber-50 to-yellow-50'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isUrgent ? 'bg-red-100 stage-pulse' : 'bg-amber-100'}`}>
                <Droplets className={`w-6 h-6 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
                  <h3 className={`font-bold text-sm ${isUrgent ? 'text-red-800' : 'text-amber-800'}`}>
                    {isUrgent ? 'Your plants need urgent attention!' : 'Quick Daily Log'}
                  </h3>
                </div>
                <p className={`text-sm mb-3 ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
                  {plantsNotLogged.length === plants.length
                    ? `Did you care for all ${plantsNotLogged.length} plant${plantsNotLogged.length !== 1 ? 's' : ''} today? Select what you did and log them all at once.`
                    : `${plantsNotLogged.length} of ${plants.length} plant${plants.length !== 1 ? 's' : ''} still need today's log.`}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {careActions.map(({ key, label, icon: Icon, activeBg, activeRing }) => {
                    const active = selectedActions[key];
                    return (
                      <button
                        key={key}
                        onClick={() => toggleAction(key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                          active
                            ? `${activeBg} ring-2 ${activeRing}`
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleBulkLog}
                  disabled={bulkLogging || !hasAnyAction}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkLogging ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Log All {plantsNotLogged.length} Plant{plantsNotLogged.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(wateredToday || bulkDone) && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-emerald-800">
              {bulkDone ? 'All plants logged!' : "Today's watering done!"}
            </h3>
            <p className="text-sm text-emerald-700">
              {bulkDone
                ? `Care logged for all ${plants.length} plant${plants.length !== 1 ? 's' : ''}. Keep this up!`
                : 'Your plants are happy. Keep this up to hit 5 waterings this week.'}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-r from-green-700 via-emerald-800 to-amber-900 p-5 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">{todayMessage.emphasis}</p>
            <p className="text-sm text-white/90 leading-relaxed">{todayMessage.text}</p>
            <button
              onClick={() => onNavigate('trade-centre')}
              className="mt-3 inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Visit Trade Centre
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
