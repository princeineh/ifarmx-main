import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users, Search, Shield, ShieldOff, ChevronLeft, ChevronRight,
  Building2, User, UsersRound, Trash2, CheckSquare, Square, UserPlus, X
} from 'lucide-react';

interface AdminUser {
  id: string;
  display_name: string | null;
  user_type: string;
  is_admin: boolean;
  state_of_origin: string | null;
  phone_number: string | null;
  created_at: string;
  plants_count?: number;
}

interface Program {
  id: string;
  name: string;
  status: string;
  target_participants: number;
  org_user_id: string;
  org_name?: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadUsers();
  }, [page, filterType]);

  useEffect(() => {
    if (showAssignModal) {
      loadPrograms();
    }
  }, [showAssignModal]);

  const loadUsers = async () => {
    setLoading(true);

    let query = supabase
      .from('user_profiles')
      .select('id, display_name, user_type, is_admin, state_of_origin, phone_number, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterType !== 'all') {
      if (filterType === 'admin') {
        query = query.eq('is_admin', true);
      } else {
        query = query.eq('user_type', filterType);
      }
    }

    const { data, count } = await query;
    setUsers(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  const toggleAdmin = async (userId: string, currentValue: boolean) => {
    await supabase
      .from('user_profiles')
      .update({ is_admin: !currentValue, updated_at: new Date().toISOString() })
      .eq('id', userId);

    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, is_admin: !currentValue } : u
    ));
  };

  const changeUserType = async (userId: string, newType: string) => {
    await supabase
      .from('user_profiles')
      .update({ user_type: newType, updated_at: new Date().toISOString() })
      .eq('id', userId);

    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, user_type: newType } : u
    ));
  };

  const deleteUser = async (userId: string, displayName: string | null) => {
    if (!confirm(`Are you sure you want to delete user "${displayName || 'Unnamed'}"? This will delete all their data including plants, care logs, and program participation. This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      alert(`Failed to delete user: ${error.message}`);
    } else {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setTotalCount(prev => prev - 1);
    }
  };

  const bulkDeleteUsers = async () => {
    if (selectedUsers.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} users? This will delete all their data including plants, care logs, and program participation. This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);

    const deletePromises = Array.from(selectedUsers).map(userId =>
      supabase.auth.admin.deleteUser(userId)
    );

    const results = await Promise.allSettled(deletePromises);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    if (failCount > 0) {
      alert(`Deleted ${successCount} users. Failed to delete ${failCount} users.`);
    } else {
      alert(`Successfully deleted ${successCount} users.`);
    }

    setSelectedUsers(new Set());
    setDeleting(false);
    await loadUsers();
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const loadPrograms = async () => {
    const { data: programsData } = await supabase
      .from('programs')
      .select('id, name, status, target_participants, org_user_id')
      .order('created_at', { ascending: false });

    if (programsData) {
      const orgIds = [...new Set(programsData.map(p => p.org_user_id))];
      const { data: orgsData } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', orgIds);

      const orgMap = new Map((orgsData || []).map(o => [o.id, o.display_name]));

      setPrograms(programsData.map(p => ({
        ...p,
        org_name: orgMap.get(p.org_user_id) || 'Unknown Org',
      })));
    }
  };

  const assignUsersToProgram = async () => {
    if (!selectedProgram || selectedUsers.size === 0) return;

    setAssigning(true);

    const userIds = Array.from(selectedUsers);

    const existingParticipants = await supabase
      .from('program_participants')
      .select('user_id')
      .eq('program_id', selectedProgram)
      .in('user_id', userIds);

    const existingUserIds = new Set((existingParticipants.data || []).map(p => p.user_id));
    const newUserIds = userIds.filter(id => !existingUserIds.has(id));

    if (newUserIds.length === 0) {
      alert('All selected users are already participants in this program.');
      setAssigning(false);
      return;
    }

    const participantsToInsert = newUserIds.map(userId => ({
      program_id: selectedProgram,
      user_id: userId,
      status: 'active' as const,
      joined_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('program_participants')
      .insert(participantsToInsert);

    setAssigning(false);

    if (error) {
      alert(`Failed to assign users: ${error.message}`);
    } else {
      const skipped = userIds.length - newUserIds.length;
      if (skipped > 0) {
        alert(`Successfully assigned ${newUserIds.length} users to the program. ${skipped} users were already participants.`);
      } else {
        alert(`Successfully assigned ${newUserIds.length} users to the program.`);
      }
      setShowAssignModal(false);
      setSelectedUsers(new Set());
      setSelectedProgram('');
    }
  };

  const filteredUsers = search
    ? users.filter(u =>
        (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
        u.id.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'organization': return <Building2 className="w-3.5 h-3.5" />;
      case 'family': return <UsersRound className="w-3.5 h-3.5" />;
      default: return <User className="w-3.5 h-3.5" />;
    }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case 'organization': return 'bg-blue-100 text-blue-700';
      case 'family': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'individual', 'organization', 'family', 'admin'].map(t => (
            <button
              key={t}
              onClick={() => { setFilterType(t); setPage(0); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                filterType === t
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selectedUsers.size > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Assign to Program
            </button>
            <button
              onClick={bulkDeleteUsers}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : `Delete ${selectedUsers.size}`}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">State</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Admin</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelectUser(u.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {selectedUsers.has(u.id) ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                            {(u.display_name || 'U')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{u.display_name || 'Unnamed'}</p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">{u.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.user_type}
                          onChange={(e) => changeUserType(u.id, e.target.value)}
                          className={`text-xs font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer ${typeBadge(u.user_type)}`}
                        >
                          <option value="individual">Individual</option>
                          <option value="organization">Organization</option>
                          <option value="family">Family</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{u.state_of_origin || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{u.phone_number || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAdmin(u.id, u.is_admin)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              u.is_admin
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {u.is_admin ? <ShieldOff className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {u.is_admin ? 'Remove' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => deleteUser(u.id, u.display_name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                            title="Delete user"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No users found</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-gray-700">Page {page + 1}/{totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Assign Users to Program</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Assigning {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} as participants
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedProgram('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Program
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Choose a program...</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.org_name} ({p.status})
                  </option>
                ))}
              </select>

              {programs.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">Loading programs...</p>
              )}

              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700 font-medium">
                  Selected users will be added as active participants in the chosen program.
                  If any user is already a participant, they will be skipped.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedProgram('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignUsersToProgram}
                disabled={!selectedProgram || assigning}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {assigning ? 'Assigning...' : 'Assign Users'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
