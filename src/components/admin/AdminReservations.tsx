import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Loader2, Search, MapPin, Phone, Mail, Package,
  Calendar, ChevronDown, ChevronUp, Users, Trash2, CheckSquare, Square, FlaskConical, CalendarClock
} from 'lucide-react';

interface Reservation {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  state: string | null;
  kit_count: string;
  reservation_type: string;
  future_interests: string[];
  batch: number;
  status: string;
  created_at: string;
}

type SortField = 'created_at' | 'full_name' | 'country' | 'kit_count';
type SortDir = 'asc' | 'desc';

export function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    setReservations(data || []);
    setLoading(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const deleteReservation = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete reservation for "${name}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from('reservations').delete().eq('id', id);

    if (error) {
      alert(`Failed to delete reservation: ${error.message}`);
    } else {
      setReservations(prev => prev.filter(r => r.id !== id));
    }
  };

  const bulkDeleteReservations = async () => {
    if (selectedReservations.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedReservations.size} reservations? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);

    const deletePromises = Array.from(selectedReservations).map(id =>
      supabase.from('reservations').delete().eq('id', id)
    );

    const results = await Promise.allSettled(deletePromises);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    if (failCount > 0) {
      alert(`Deleted ${successCount} reservations. Failed to delete ${failCount} reservations.`);
    } else {
      alert(`Successfully deleted ${successCount} reservations.`);
    }

    setSelectedReservations(new Set());
    setDeleting(false);
    await loadReservations();
  };

  const toggleSelectAll = () => {
    if (selectedReservations.size === filtered.length) {
      setSelectedReservations(new Set());
    } else {
      setSelectedReservations(new Set(filtered.map(r => r.id)));
    }
  };

  const toggleSelectReservation = (id: string) => {
    const newSelected = new Set(selectedReservations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedReservations(newSelected);
  };

  const uniqueCountries = [...new Set(reservations.map(r => r.country).filter(Boolean))].sort();

  const filtered = reservations
    .filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.state || '').toLowerCase().includes(q);
      const matchCountry = !countryFilter || r.country === countryFilter;
      return matchSearch && matchCountry;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'created_at') {
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
      if (sortField === 'full_name') {
        return dir * a.full_name.localeCompare(b.full_name);
      }
      if (sortField === 'country') {
        return dir * (a.country || '').localeCompare(b.country || '');
      }
      if (sortField === 'kit_count') {
        return dir * a.kit_count.localeCompare(b.kit_count);
      }
      return 0;
    });

  const kitCountSummary = reservations.reduce((acc, r) => {
    acc[r.kit_count] = (acc[r.kit_count] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countrySummary = reservations.reduce((acc, r) => {
    const c = r.country || 'Unknown';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const testRunCount = reservations.filter(r => (r.reservation_type || 'test_run') === 'test_run').length;
  const reserveCount = reservations.filter(r => r.reservation_type === 'reserve').length;

  const interestSummary = reservations.reduce((acc, r) => {
    (r.future_interests || []).forEach(i => {
      acc[i] = (acc[i] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const interestLabels: Record<string, string> = {
    fishery: 'Fishery',
    poultry: 'Poultry',
    cash_crops: 'Cash Crops',
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-400" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-emerald-400" />
      : <ChevronDown className="w-3 h-3 text-emerald-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{reservations.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Reservations</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{Object.keys(countrySummary).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Countries</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {Object.entries(countrySummary).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${c}: ${n}`).join(', ')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {Object.entries(kitCountSummary).map(([k, v]) => `${k}: ${v}`).join(' | ') || '0'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Kit Demand (by count)</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm font-bold text-gray-900 space-y-0.5">
            {Object.entries(interestSummary).map(([key, count]) => (
              <p key={key} className="text-xs">{interestLabels[key] || key}: <span className="font-bold">{count}</span></p>
            ))}
            {Object.keys(interestSummary).length === 0 && <p className="text-xs text-gray-400">None yet</p>}
          </div>
          <p className="text-xs text-gray-500 mt-1">Future Kit Interest</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-3">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <FlaskConical className="w-3 h-3 text-amber-500" />
              Test Run: <span className="font-bold text-gray-900">{testRunCount}</span>
            </p>
            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <CalendarClock className="w-3 h-3 text-blue-500" />
              Reserve: <span className="font-bold text-gray-900">{reserveCount}</span>
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Join Type</p>
        </div>
      </div>

      {selectedReservations.size > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-red-700">
            {selectedReservations.size} reservation{selectedReservations.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={bulkDeleteReservations}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : `Delete ${selectedReservations.size} Reservation${selectedReservations.size > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, or state..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
              />
            </div>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="">All Countries</option>
              {uniqueCountries.map(c => (
                <option key={c} value={c}>{c} ({countrySummary[c]})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {selectedReservations.size === filtered.length && filtered.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              {selectedReservations.size > 0 ? `${selectedReservations.size} selected` : 'Select all'}
            </button>
            <p className="text-xs text-gray-400">{filtered.length} of {reservations.length} reservations</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 w-12"></th>
                {[
                  { field: 'full_name' as SortField, label: 'Name' },
                  { field: 'country' as SortField, label: 'Location' },
                  { field: 'kit_count' as SortField, label: 'Kits' },
                  { field: 'created_at' as SortField, label: 'Reserved' },
                ].map(col => (
                  <th
                    key={col.field}
                    onClick={() => toggleSort(col.field)}
                    className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.field} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Interests</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectReservation(r.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {selectedReservations.has(r.id) ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                        {r.full_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{r.full_name}</p>
                        <p className="text-[11px] text-gray-400">Batch {r.batch}</p>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700">{r.country || 'Nigeria'}</p>
                        {r.state && <p className="text-[11px] text-gray-400">{r.state}</p>}
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                      <Package className="w-3 h-3" />
                      {r.kit_count}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <p className="text-sm text-gray-700">{new Date(r.created_at).toLocaleDateString()}</p>
                    <p className="text-[11px] text-gray-400">{new Date(r.created_at).toLocaleTimeString()}</p>
                  </td>
                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    {(r.reservation_type || 'test_run') === 'test_run' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold">
                        <FlaskConical className="w-3 h-3" />
                        Test Run
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                        <CalendarClock className="w-3 h-3" />
                        Reserve
                      </span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    {expandedId === r.id ? (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-700 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {r.email}
                        </p>
                        <p className="text-xs text-gray-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {r.phone}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Click to view</p>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <div className="flex flex-wrap gap-1">
                      {(r.future_interests || []).map(i => (
                        <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                          {interestLabels[i] || i}
                        </span>
                      ))}
                      {(!r.future_interests || r.future_interests.length === 0) && (
                        <span className="text-[11px] text-gray-300">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReservation(r.id, r.full_name);
                      }}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                      title="Delete reservation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">
                    No reservations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
