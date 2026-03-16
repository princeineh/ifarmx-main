import { Droplets, Sprout, Scissors, Bug, Calendar } from 'lucide-react';
import type { Plant, CareLog } from '../../types/database';

interface RecentActivityProps {
  logs: CareLog[];
  plants: Plant[];
}

export function RecentActivity({ logs, plants }: RecentActivityProps) {
  if (logs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-green-50">
        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {logs.slice(0, 4).map((log) => {
          const plant = plants.find(p => p.id === log.plant_id);
          const actions = [];
          if (log.watered) actions.push({ icon: Droplets, label: 'Watered', color: 'text-blue-500 bg-blue-50' });
          if (log.fertilized) actions.push({ icon: Sprout, label: 'Fertilized', color: 'text-emerald-500 bg-emerald-50' });
          if (log.weeded) actions.push({ icon: Scissors, label: 'Weeded', color: 'text-amber-500 bg-amber-50' });
          if (log.pest_checked) actions.push({ icon: Bug, label: 'Pest Check', color: 'text-red-500 bg-red-50' });

          return (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-green-100 to-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {plant?.name || 'Unknown Plant'}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {new Date(log.log_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {log.notes && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-1">{log.notes}</p>
                  )}
                  <div className="flex gap-1.5 flex-wrap">
                    {actions.map(({ icon: ActionIcon, label, color }) => (
                      <span key={label} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${color}`}>
                        <ActionIcon className="w-3 h-3" />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
