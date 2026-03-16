import { useState } from 'react';
import {
  Search, ChevronDown, ChevronUp, AlertTriangle,
  Droplets, Sprout, MessageCircle, ArrowUpDown, Filter
} from 'lucide-react';
import type { MonitorUser } from './types';

interface UserHealthTableProps {
  users: MonitorUser[];
  onEncourage: (user: MonitorUser) => void;
  onBulkEncourage: (users: MonitorUser[]) => void;
}

type SortKey = 'health_score' | 'care_logs_week' | 'days_inactive' | 'display_name';
type SortDir = 'asc' | 'desc';
type HealthFilter = 'all' | 'thriving' | 'healthy' | 'needs_attention' | 'at_risk' | 'critical';
type TypeFilter = 'all' | 'individual' | 'family' | 'organization';

const HEALTH_COLORS: Record<string, string> = {
  'Thriving': 'bg-emerald-100 text-emerald-700',
  'Healthy': 'bg-green-100 text-green-700',
  'Needs Attention': 'bg-amber-100 text-amber-700',
  'At Risk': 'bg-orange-100 text-orange-700',
  'Critical': 'bg-red-100 text-red-700',
};

const STAGE_ORDER = ['nursery', 'transplant', 'flowering', 'fruiting', 'harvest'];

export function UserHealthTable({ users, onEncourage, onBulkEncourage }: UserHealthTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('health_score');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'display_name' ? 'asc' : 'desc');
    }
  };

  let filtered = users;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u =>
      u.display_name.toLowerCase().includes(q) ||
      u.user_type.toLowerCase().includes(q)
    );
  }
  if (healthFilter !== 'all') {
    const labelMap: Record<string, string> = {
      thriving: 'Thriving', healthy: 'Healthy',
      needs_attention: 'Needs Attention', at_risk: 'At Risk', critical: 'Critical',
    };
    filtered = filtered.filter(u => u.health_label === labelMap[healthFilter]);
  }
  if (typeFilter !== 'all') {
    filtered = filtered.filter(u => u.user_type === typeFilter);
  }

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'health_score': cmp = a.health_score - b.health_score; break;
      case 'care_logs_week': cmp = a.care_logs_week - b.care_logs_week; break;
      case 'days_inactive': cmp = a.days_inactive - b.days_inactive; break;
      case 'display_name': cmp = a.display_name.localeCompare(b.display_name); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSelect = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map(u => u.user_id)));
    }
  };

  const selectedUsers = sorted.filter(u => selectedIds.has(u.user_id));

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 group">
      <span>{label}</span>
      <ArrowUpDown className={`w-3 h-3 transition-colors ${sortKey === field ? 'text-emerald-600' : 'text-gray-300 group-hover:text-gray-500'}`} />
    </button>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">All Growers ({users.length})</h3>
          {selectedIds.size > 0 && (
            <button
              onClick={() => onBulkEncourage(selectedUsers)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Encourage {selectedIds.size} Selected
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search growers..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-1.5">
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value as HealthFilter)}
              className="px-2.5 py-2 rounded-lg text-xs font-semibold border border-gray-200 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Health</option>
              <option value="thriving">Thriving</option>
              <option value="healthy">Healthy</option>
              <option value="needs_attention">Needs Attention</option>
              <option value="at_risk">At Risk</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="px-2.5 py-2 rounded-lg text-xs font-semibold border border-gray-200 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="individual">Individual</option>
              <option value="family">Family</option>
              <option value="organization">Organization</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={sorted.length > 0 && selectedIds.size === sorted.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                <SortHeader label="Grower" field="display_name" />
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase hidden sm:table-cell">Type</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                <SortHeader label="Health" field="health_score" />
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase hidden md:table-cell">Stage</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase hidden sm:table-cell">
                <SortHeader label="Logs/Wk" field="care_logs_week" />
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase hidden md:table-cell">
                <SortHeader label="Inactive" field="days_inactive" />
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(u => (
              <tr key={u.user_id} className={`hover:bg-gray-50/50 transition-colors ${u.days_inactive >= 7 ? 'bg-red-50/30' : ''}`}>
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.user_id)}
                    onChange={() => toggleSelect(u.user_id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 flex-shrink-0">
                      {(u.display_name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">{u.display_name}</p>
                      <p className="text-[10px] text-gray-400">{u.plants.length} plant{u.plants.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 hidden sm:table-cell">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    u.user_type === 'organization' ? 'bg-amber-100 text-amber-700'
                    : u.user_type === 'family' ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {u.user_type}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          u.health_score >= 80 ? 'bg-emerald-500'
                          : u.health_score >= 60 ? 'bg-green-400'
                          : u.health_score >= 40 ? 'bg-amber-400'
                          : u.health_score >= 20 ? 'bg-orange-400'
                          : 'bg-red-400'
                        }`}
                        style={{ width: `${u.health_score}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${HEALTH_COLORS[u.health_label] || 'bg-gray-100 text-gray-600'}`}>
                      {Math.round(u.health_score)}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell">
                  <span className="text-[10px] font-medium text-gray-600 capitalize">{u.stage_highest}</span>
                </td>
                <td className="px-3 py-2.5 hidden sm:table-cell">
                  <span className={`text-xs font-semibold ${u.care_logs_week >= 5 ? 'text-emerald-600' : u.care_logs_week >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
                    {u.care_logs_week}
                  </span>
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell">
                  {u.days_inactive >= 7 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      {u.days_inactive}d
                    </span>
                  ) : u.days_inactive >= 3 ? (
                    <span className="text-[10px] font-semibold text-amber-600">{u.days_inactive}d</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-green-600">{u.days_inactive}d</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => onEncourage(u)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Encourage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-8">
          <Sprout className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No growers match your filters</p>
        </div>
      )}
    </div>
  );
}
