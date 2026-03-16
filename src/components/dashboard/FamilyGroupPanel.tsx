import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users, Plus, Trash2, Edit3, Check, X, Loader2, Sprout, Phone,
  ChevronRight, ChevronDown, ChevronUp, TreePine, UserPlus, BarChart3, ArrowRight
} from 'lucide-react';
import type { Plant } from '../../types/database';

interface FamilyGroupPanelProps {
  plants: Plant[];
  onNavigate: (page: string, data?: any) => void;
}

interface GroupData {
  id: string;
  group_type: 'family' | 'group';
  group_name: string;
  total_seeds: number;
}

interface MemberData {
  id: string;
  name: string;
  relationship: string | null;
  seeds_allocated: number;
  phone: string | null;
}

export function FamilyGroupPanel({ plants, onNavigate }: FamilyGroupPanelProps) {
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({ name: '', relationship: '', phone: '' });
  const [assigningPlant, setAssigningPlant] = useState<string | null>(null);
  const [reassigningPlant, setReassigningPlant] = useState<{ plantId: string; currentMember: string | null } | null>(null);

  useEffect(() => {
    if (user) loadGroup();
  }, [user]);

  const loadGroup = async () => {
    if (!user) return;
    const { data: groups } = await supabase
      .from('farming_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (groups && groups.length > 0) {
      const g = groups[0];
      setGroup({ id: g.id, group_type: g.group_type, group_name: g.group_name, total_seeds: g.total_seeds });

      const { data: memberData } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', g.id)
        .order('created_at');

      setMembers(
        (memberData || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          relationship: m.relationship,
          seeds_allocated: m.seeds_allocated,
          phone: m.phone,
        }))
      );
    }
    setLoading(false);
  };

  const handleAddMember = async () => {
    if (!group || !newMember.name.trim()) return;
    setSaving(true);

    const { error } = await supabase.from('group_members').insert({
      group_id: group.id,
      name: newMember.name.trim(),
      relationship: newMember.relationship.trim() || null,
      seeds_allocated: 0,
      phone: newMember.phone.trim() || null,
    });

    if (!error) {
      setNewMember({ name: '', relationship: '', phone: '' });
      setAddingMember(false);
      await loadGroup();
    }
    setSaving(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    setSaving(true);
    await supabase.from('group_members').delete().eq('id', memberId);
    await loadGroup();
    setSaving(false);
  };

  const getMemberPlants = (memberId: string): Plant[] => {
    return plants.filter(p => p.group_member_id === memberId);
  };

  const getUnassignedPlants = (): Plant[] => {
    if (!group) return [];
    return plants.filter(p => p.farming_group_id === group.id && !p.group_member_id);
  };

  const handleAssignPlant = async (plantId: string, memberId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('plants')
      .update({ group_member_id: memberId })
      .eq('id', plantId);

    if (!error) {
      setAssigningPlant(null);
      setReassigningPlant(null);
      window.location.reload();
    }
    setSaving(false);
  };

  const handleUnassignPlant = async (plantId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('plants')
      .update({ group_member_id: null })
      .eq('id', plantId);

    if (!error) {
      window.location.reload();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!group) return null;

  const label = group.group_type === 'family' ? 'Family' : 'Group';
  const totalPlants = plants.filter(p => p.farming_group_id === group.id).length;
  const unassigned = getUnassignedPlants();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{group.group_name}</h2>
              <p className="text-xs text-gray-500">{label} -- {members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-500" />
              <span className="text-lg font-bold text-gray-900">{totalPlants}</span>
            </div>
            <p className="text-[10px] text-gray-500">Total Plants</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {members.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No members added yet</p>
            <p className="text-xs text-gray-400 mt-1">Add members to track kit assignments</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const memberPlants = getMemberPlants(m.id);
              const isExpanded = expandedMember === m.id;

              return (
                <div key={m.id} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">{m.name[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {m.relationship && <span>{m.relationship}</span>}
                        {m.phone && (
                          <span className="flex items-center gap-0.5">
                            <Phone className="w-2.5 h-2.5" /> {m.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                        {memberPlants.length} plant{memberPlants.length !== 1 ? 's' : ''}
                      </span>
                      {editing ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.id); }}
                          disabled={saving}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        isExpanded
                          ? <ChevronUp className="w-4 h-4 text-gray-400" />
                          : <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-white px-3 py-2">
                      {memberPlants.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2 text-center">No plants assigned yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {memberPlants.map(plant => (
                            <div
                              key={plant.id}
                              className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-emerald-50 transition-colors group"
                            >
                              <button
                                onClick={() => onNavigate('plant', plant)}
                                className="flex-1 flex items-center gap-3 text-left"
                              >
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                  <TreePine className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{plant.name}</p>
                                  <p className="text-[10px] text-gray-500 capitalize">{plant.stage}</p>
                                </div>
                              </button>
                              {editing && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setReassigningPlant({ plantId: plant.id, currentMember: m.id })}
                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg text-xs"
                                    title="Reassign"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleUnassignPlant(plant.id)}
                                    disabled={saving}
                                    className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg text-xs"
                                    title="Unassign"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                              {!editing && (
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {memberPlants.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs font-semibold text-gray-700">{m.name}'s Performance</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-emerald-50 rounded-lg p-2 text-center">
                              <p className="text-lg font-bold text-emerald-700">{memberPlants.length}</p>
                              <p className="text-[10px] text-emerald-600">Plants</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                              <p className="text-lg font-bold text-blue-700">
                                {memberPlants.filter(p => p.health_status === 'healthy' || p.health_status === 'excellent').length}
                              </p>
                              <p className="text-[10px] text-blue-600">Healthy</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2 text-center">
                              <p className="text-lg font-bold text-amber-700">
                                {memberPlants.filter(p => p.health_status === 'needs_attention' || p.health_status === 'critical').length}
                              </p>
                              <p className="text-[10px] text-amber-600">Attention</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {unassigned.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-amber-700">
                    {unassigned.length} unassigned plant{unassigned.length !== 1 ? 's' : ''} (yours)
                  </p>
                  {members.length > 0 && (
                    <span className="text-[10px] text-amber-600">Click assign to allocate</span>
                  )}
                </div>
                <div className="space-y-1">
                  {unassigned.map(plant => (
                    <div
                      key={plant.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <button
                        onClick={() => onNavigate('plant', plant)}
                        className="flex-1 flex items-center gap-2.5 text-left"
                      >
                        <TreePine className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-800 truncate">{plant.name}</span>
                      </button>
                      {members.length > 0 && (
                        assigningPlant === plant.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500"
                              onChange={(e) => {
                                if (e.target.value) handleAssignPlant(plant.id, e.target.value);
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Select member</option>
                              {members.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setAssigningPlant(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningPlant(plant.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                          >
                            <UserPlus className="w-3 h-3" />
                            Assign
                          </button>
                        )
                      )}
                      <button onClick={() => onNavigate('plant', plant)}>
                        <ChevronRight className="w-3 h-3 text-amber-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reassigningPlant && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-5 w-full max-w-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Reassign Plant</h3>
                  <p className="text-sm text-gray-600 mb-4">Select a member to assign this plant to:</p>
                  <div className="space-y-2 mb-4">
                    {members.filter(m => m.id !== reassigningPlant.currentMember).map(member => (
                      <button
                        key={member.id}
                        onClick={() => handleAssignPlant(reassigningPlant.plantId, member.id)}
                        disabled={saving}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{member.name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                          {member.relationship && <p className="text-xs text-gray-500">{member.relationship}</p>}
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setReassigningPlant(null)}
                    className="w-full py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {addingMember && (
          <div className="mt-3 border border-blue-200 rounded-xl p-4 bg-blue-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Name"
                autoFocus
              />
              <input
                type="text"
                value={newMember.relationship}
                onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Relationship"
              />
              <input
                type="text"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Phone (optional)"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setAddingMember(false); setNewMember({ name: '', relationship: '', phone: '' }); }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={saving || !newMember.name.trim()}
                className="px-4 py-1.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setAddingMember(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Member
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
              editing ? 'text-blue-600 bg-blue-100' : 'text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {editing ? <><Check className="w-4 h-4" /> Done</> : <><Edit3 className="w-4 h-4" /> Manage</>}
          </button>
        </div>
      </div>
    </div>
  );
}
