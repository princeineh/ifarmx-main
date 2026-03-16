import { Package, ShoppingBag, Sprout, Calendar } from 'lucide-react';
import type { Plant } from '../../types/database';

interface KitOverviewProps {
  plants: Plant[];
  kitCount: number;
  onBuyKit: () => void;
  onActivateKit: () => void;
}

export function KitOverview({ plants, kitCount, onBuyKit, onActivateKit }: KitOverviewProps) {
  const totalPlants = plants.length;
  const oldestPlant = plants.length > 0
    ? plants.reduce((oldest, p) => new Date(p.planted_date) < new Date(oldest.planted_date) ? p : oldest, plants[0])
    : null;

  const daysSincePlanting = oldestPlant
    ? Math.floor((Date.now() - new Date(oldestPlant.planted_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const monthsActive = Math.floor(daysSincePlanting / 30);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{kitCount}</p>
        <p className="text-xs text-gray-500 font-medium mt-1">Kits Purchased</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{totalPlants}</p>
        <p className="text-xs text-gray-500 font-medium mt-1">Active Plants</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{monthsActive}</p>
        <p className="text-xs text-gray-500 font-medium mt-1">Months Active</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <button
            onClick={onBuyKit}
            className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Buy Kit
          </button>
          <button
            onClick={onActivateKit}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Activate
          </button>
        </div>
        <p className="text-xs text-gray-500 font-medium mt-2">Quick Actions</p>
      </div>
    </div>
  );
}
