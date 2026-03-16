import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  FolderOpen, Globe, Lock, Users, Search,
  CheckCircle, AlertCircle, XCircle, Trash2, CheckSquare, Square
} from 'lucide-react';

interface AdminProgram {
  id: string;
  name: string;
  description: string | null;
  status: string;
  acceptance_type: string;
  target_participants: number;
  start_date: string | null;
  org_name: string | null;
  org_user_id: string;
  participant_count: number;
  application_count: number;
  created_at: string;
}

export function AdminPrograms() {
  const [programs, setPrograms] = useState<AdminProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    const { data } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    const orgIds = [...new Set(data.map(p => p.org_user_id))];
    const programIds = data.map(p => p.id);

    const [orgsRes, allParts, allApps] = await Promise.all([
      supabase.from('user_profiles').select('id, display_name').in('id', orgIds),
      supabase.from('program_participants').select('program_id').in('program_id', programIds),
      supabase.from('program_applications').select('program_id').in('program_id', programIds).eq('status', 'pending'),
    ]);

    const orgMap = new Map((orgsRes.data || []).map(o => [o.id, o.display_name]));
    const partCounts: Record<string, number> = {};
    const appCounts: Record<string, number> = {};
    (allParts.data || []).forEach(r => { partCounts[r.program_id] = (partCounts[r.program_id] || 0) + 1; });
    (allApps.data || []).forEach(r => { appCounts[r.program_id] = (appCounts[r.program_id] || 0) + 1; });

    const result: AdminProgram[] = data.map(prog => ({
      ...prog,
      org_name: orgMap.get(prog.org_user_id) || 'Unknown Org',
      participant_count: partCounts[prog.id] || 0,
      application_count: appCounts[prog.id] || 0,
    }));

    setPrograms(result);
    setLoading(false);
  };

  const updateProgramStatus = async (programId: string, newStatus: string) => {
    await supabase.from('programs').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', programId);
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, status: newStatus } : p));
  };

  const deleteProgram = async (programId: string, programName: string) => {
    if (!confirm(`Are you sure you want to delete program "${programName}"? This will also delete all participants, applications, and related data. This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from('programs').delete().eq('id', programId);

    if (error) {
      alert(`Failed to delete program: ${error.message}`);
    } else {
      setPrograms(prev => prev.filter(p => p.id !== programId));
    }
  };

  const bulkDeletePrograms = async () => {
    if (selectedPrograms.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedPrograms.size} programs? This will also delete all participants, applications, and related data. This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);

    const deletePromises = Array.from(selectedPrograms).map(programId =>
      supabase.from('programs').delete().eq('id', programId)
    );

    const results = await Promise.allSettled(deletePromises);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    if (failCount > 0) {
      alert(`Deleted ${successCount} programs. Failed to delete ${failCount} programs.`);
    } else {
      alert(`Successfully deleted ${successCount} programs.`);
    }

    setSelectedPrograms(new Set());
    setDeleting(false);
    await loadPrograms();
  };

  const toggleSelectAll = () => {
    if (selectedPrograms.size === filtered.length) {
      setSelectedPrograms(new Set());
    } else {
      setSelectedPrograms(new Set(filtered.map(p => p.id)));
    }
  };

  const toggleSelectProgram = (programId: string) => {
    const newSelected = new Set(selectedPrograms);
    if (newSelected.has(programId)) {
      newSelected.delete(programId);
    } else {
      newSelected.add(programId);
    }
    setSelectedPrograms(newSelected);
  };

  const filtered = programs.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (p.name.toLowerCase().includes(s) || (p.org_name || '').toLowerCase().includes(s));
    }
    return true;
  });

  const statusColor = (s: string) => {
    switch (s) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programs or org name..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'draft', 'published', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSelectAll}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {selectedPrograms.size === filtered.length ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            {selectedPrograms.size > 0 ? `${selectedPrograms.size} selected` : 'Select all'}
          </button>

          {selectedPrograms.size > 0 && (
            <button
              onClick={bulkDeletePrograms}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : `Delete ${selectedPrograms.size} Program${selectedPrograms.size > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No programs match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((prog) => {
            const fillPct = Math.min(100, (prog.participant_count / prog.target_participants) * 100);

            return (
              <div key={prog.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleSelectProgram(prog.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors mt-0.5 flex-shrink-0"
                    >
                      {selectedPrograms.has(prog.id) ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900 text-sm">{prog.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColor(prog.status)}`}>
                        {prog.status}
                      </span>
                      {prog.acceptance_type === 'open' ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600"><Globe className="w-3 h-3" /> Open</span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500"><Lock className="w-3 h-3" /> Invite</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">by {prog.org_name}</p>
                    {prog.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{prog.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <select
                      value={prog.status}
                      onChange={(e) => updateProgramStatus(prog.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 font-semibold focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => deleteProgram(prog.id, prog.name)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                      title="Delete program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-gray-900">{prog.participant_count}</p>
                    <p className="text-[10px] text-gray-500">Participants</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-gray-900">{prog.target_participants}</p>
                    <p className="text-[10px] text-gray-500">Target</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-amber-600">{prog.application_count}</p>
                    <p className="text-[10px] text-gray-500">Pending</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-gray-600">{prog.start_date ? new Date(prog.start_date).toLocaleDateString() : '-'}</p>
                    <p className="text-[10px] text-gray-500">Start</p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{Math.round(fillPct)}% filled</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
