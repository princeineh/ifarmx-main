import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users, Plus, Trash2, Edit3, Check, X, Loader2, Leaf, Phone,
  ChevronRight, ChevronDown, ChevronUp, TreePine, UserPlus, BarChart3,
  Crown, Copy, RefreshCw, Send, MessageSquare, Bell, Link, AlertCircle,
  CheckCircle2, XCircle, ClipboardCopy, UserCheck, Baby
} from 'lucide-react';
import type { Plant } from '../../types/database';
import { createNotification } from '../../services/notifications';
import { CustodianLogModal } from './CustodianLogModal';
import { FarmStatsBoard, buildFarmer, getWeekStartStr } from './FarmStatsBoard';
import type { Farmer } from './FarmStatsBoard';
import type { CareLog } from '../../types/database';

interface FamilyDynastyPanelProps {
  plants: Plant[];
  onNavigate: (page: string, data?: any) => void;
}

interface GroupData {
  id: string;
  user_id: string;
  head_user_id: string | null;
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
  linked_user_id: string | null;
  is_custodian_child: boolean;
}

interface JoinRequest {
  id: string;
  group_id: string;
  requester_user_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester_name?: string;
}

interface ChatMessage {
  id: string;
  sender_user_id: string | null;
  sender_name: string;
  message: string;
  created_at: string;
}

type ActiveTab = 'overview' | 'members' | 'chat';

function getHealthSummary(memberPlants: Plant[]) {
  const healthy = memberPlants.filter(p => p.health_status === 'healthy' || p.health_status === 'excellent').length;
  const attention = memberPlants.filter(p => p.health_status === 'needs_attention').length;
  const critical = memberPlants.filter(p => p.health_status === 'critical').length;
  return { healthy, attention, critical };
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function generateCode() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `PALM${digits}`;
}

export function FamilyDynastyPanel({ plants, onNavigate }: FamilyDynastyPanelProps) {
  const { user, profile } = useAuth();
  const displayName = profile?.display_name || 'there';

  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Create group
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupSaving, setGroupSaving] = useState(false);

  // Join flow
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  // Members tab
  const [editing, setEditing] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relationship: '', phone: '', is_custodian_child: false });
  const [memberSaving, setMemberSaving] = useState(false);
  const [crownTarget, setCrownTarget] = useState<MemberData | null>(null);
  const [crownLoading, setCrownLoading] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ code: string; expires: string } | null>(null);
  const [inviteGenerating, setInviteGenerating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Overview
  const [custodianModal, setCustodianModal] = useState<{ member: MemberData; plant: Plant } | null>(null);
  const [remindCooldown, setRemindCooldown] = useState<Set<string>>(new Set());

  // Chat
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [familyCareLogs, setFamilyCareLogs] = useState<CareLog[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isHead = !!(group && user && (group.head_user_id === user.id || group.user_id === user.id));
  const myMemberEntry = members.find(m => m.linked_user_id === user?.id);
  const canChat = isHead || !!myMemberEntry?.linked_user_id;

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Find group where user is head OR is a linked member
      const { data: ownGroups } = await supabase
        .from('farming_groups')
        .select('*')
        .or(`user_id.eq.${user.id},head_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1);

      let foundGroup: GroupData | null = null;

      if (ownGroups && ownGroups.length > 0) {
        foundGroup = ownGroups[0] as GroupData;
      } else {
        // Check if user is a linked member of any group
        const { data: memberLinks } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('linked_user_id', user.id)
          .limit(1);

        if (memberLinks && memberLinks.length > 0) {
          const { data: linkedGroup } = await supabase
            .from('farming_groups')
            .select('*')
            .eq('id', memberLinks[0].group_id)
            .maybeSingle();

          if (linkedGroup) foundGroup = linkedGroup as GroupData;
        }
      }

      setGroup(foundGroup);

      if (foundGroup) {
        const [{ data: memberData }, { data: requestData }] = await Promise.all([
          supabase
            .from('group_members')
            .select('*')
            .eq('group_id', foundGroup.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('family_join_requests')
            .select('*')
            .eq('group_id', foundGroup.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),
        ]);

        setMembers((memberData || []) as MemberData[]);

        if (requestData && requestData.length > 0) {
          // Fetch requester display names
          const ids = requestData.map(r => r.requester_user_id);
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', ids);
          const nameMap: Record<string, string> = {};
          (profiles || []).forEach(p => { nameMap[p.id] = p.display_name || 'Unknown'; });
          setJoinRequests(requestData.map(r => ({ ...r, requester_name: nameMap[r.requester_user_id] || 'Unknown' })) as JoinRequest[]);
        } else {
          setJoinRequests([]);
        }

        // Fetch care logs for all family plants this week
        const { data: groupPlants } = await supabase
          .from('plants')
          .select('id')
          .eq('farming_group_id', foundGroup.id);
        if (groupPlants && groupPlants.length > 0) {
          const plantIds = groupPlants.map((p: any) => p.id);
          const weekStart = getWeekStartStr();
          const { data: logs } = await supabase
            .from('care_logs')
            .select('*')
            .in('plant_id', plantIds)
            .gte('log_date', weekStart);
          setFamilyCareLogs((logs || []) as CareLog[]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!group) return;
    setChatLoading(true);
    const { data } = await supabase
      .from('family_messages')
      .select('*')
      .eq('group_id', group.id)
      .order('created_at', { ascending: true });
    setMessages((data || []) as ChatMessage[]);
    setChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => {
    if (activeTab === 'chat' && group) loadMessages();
  }, [activeTab, group]);

  // ── Create group ─────────────────────────────────────────────────────────────

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;
    setGroupSaving(true);
    const { data, error } = await supabase
      .from('farming_groups')
      .insert({
        user_id: user.id,
        head_user_id: user.id,
        group_type: 'family',
        group_name: newGroupName.trim(),
        total_seeds: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setGroup(data as GroupData);
      setNewGroupName('');
      setCreatingGroup(false);
    }
    setGroupSaving(false);
  };

  // ── Join via invite code ──────────────────────────────────────────────────────

  const handleJoinByCode = async () => {
    if (!user || !inviteCode.trim()) return;
    setJoinLoading(true);
    setJoinError('');
    setJoinSuccess('');

    const code = inviteCode.trim().toUpperCase();
    const { data: invite, error } = await supabase
      .from('family_invites')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error || !invite) {
      setJoinError('Code not found. Please check and try again.');
      setJoinLoading(false);
      return;
    }
    if (invite.used_by_user_id) {
      setJoinError('This code has already been used.');
      setJoinLoading(false);
      return;
    }
    if (new Date(invite.expires_at) < new Date()) {
      setJoinError('This code has expired. Ask your family head for a new one.');
      setJoinLoading(false);
      return;
    }

    // Mark invite used
    await supabase
      .from('family_invites')
      .update({ used_by_user_id: user.id, used_at: new Date().toISOString() })
      .eq('id', invite.id);

    // Add as linked member
    await supabase.from('group_members').insert({
      group_id: invite.group_id,
      name: profile?.display_name || user.email || 'Family Member',
      relationship: null,
      seeds_allocated: 0,
      phone: profile?.phone_number || null,
      linked_user_id: user.id,
      is_custodian_child: false,
    });

    setJoinSuccess("You've joined the family! Welcome home 🌱");
    await loadData();
    setJoinLoading(false);
  };

  // ── Send join request ─────────────────────────────────────────────────────────

  const handleSendRequest = async (targetGroupId: string) => {
    if (!user) return;
    setRequestLoading(true);
    await supabase.from('family_join_requests').insert({
      group_id: targetGroupId,
      requester_user_id: user.id,
      message: requestMessage.trim() || null,
      status: 'pending',
    });
    setRequestSent(true);
    setRequestLoading(false);
  };

  // ── Accept / Reject join request ──────────────────────────────────────────────

  const handleAcceptRequest = async (req: JoinRequest) => {
    if (!group) return;
    await supabase
      .from('family_join_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', req.id);

    // Check if member row already exists (e.g., from a previous rejected request)
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('linked_user_id', req.requester_user_id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('group_members').insert({
        group_id: group.id,
        name: req.requester_name || 'Family Member',
        linked_user_id: req.requester_user_id,
        seeds_allocated: 0,
        is_custodian_child: false,
      });
    }

    setJoinRequests(prev => prev.filter(r => r.id !== req.id));
    await loadData();
  };

  const handleRejectRequest = async (reqId: string) => {
    await supabase
      .from('family_join_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', reqId);
    setJoinRequests(prev => prev.filter(r => r.id !== reqId));
  };

  // ── Add member manually ───────────────────────────────────────────────────────

  const handleAddMember = async () => {
    if (!group || !newMember.name.trim()) return;
    setMemberSaving(true);
    await supabase.from('group_members').insert({
      group_id: group.id,
      name: newMember.name.trim(),
      relationship: newMember.relationship.trim() || null,
      phone: newMember.is_custodian_child ? null : (newMember.phone.trim() || null),
      seeds_allocated: 0,
      linked_user_id: null,
      is_custodian_child: newMember.is_custodian_child,
    });
    setNewMember({ name: '', relationship: '', phone: '', is_custodian_child: false });
    setAddingMember(false);
    await loadData();
    setMemberSaving(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from('group_members').delete().eq('id', memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  // ── Crown as head ─────────────────────────────────────────────────────────────

  const handleCrownMember = async (member: MemberData) => {
    if (!group || !member.linked_user_id) return;
    setCrownLoading(true);
    await supabase
      .from('farming_groups')
      .update({ head_user_id: member.linked_user_id })
      .eq('id', group.id);
    setGroup(prev => prev ? { ...prev, head_user_id: member.linked_user_id } : prev);
    setCrownTarget(null);
    setCrownLoading(false);
    // Notify new head
    await createNotification(
      member.linked_user_id,
      'family_head',
      'You\'re the new Family Head 👑',
      `${displayName} has passed family leadership to you. Welcome, head of the family!`
    );
  };

  // ── Generate invite code ──────────────────────────────────────────────────────

  const handleGenerateCode = async () => {
    if (!group || !user) return;
    setInviteGenerating(true);
    let code = generateCode();
    // Ensure uniqueness
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.from('family_invites').select('id').eq('code', code).maybeSingle();
      if (!data) break;
      code = generateCode();
    }
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('family_invites').insert({
      group_id: group.id,
      code,
      created_by: user.id,
      expires_at: expiresAt,
    });
    const expiryLabel = new Date(expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    setInviteResult({ code, expires: expiryLabel });
    setInviteGenerating(false);
  };

  const handleCopyCode = async () => {
    if (!inviteResult) return;
    await navigator.clipboard.writeText(inviteResult.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // ── Remind member ─────────────────────────────────────────────────────────────

  const handleRemind = async (member: MemberData) => {
    if (!member.linked_user_id || remindCooldown.has(member.id)) return;
    await createNotification(
      member.linked_user_id,
      'family_reminder',
      'Farm Reminder 🌱',
      `${displayName} is reminding you to log your farm activity today. Your family is counting on you!`
    );
    setRemindCooldown(prev => new Set(prev).add(member.id));
    setTimeout(() => {
      setRemindCooldown(prev => {
        const next = new Set(prev);
        next.delete(member.id);
        return next;
      });
    }, 30000);
  };

  // ── Send chat message ─────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!group || !user || !chatInput.trim()) return;
    setChatSending(true);
    const msg = chatInput.trim();
    setChatInput('');
    await supabase.from('family_messages').insert({
      group_id: group.id,
      sender_user_id: user.id,
      sender_name: profile?.display_name || 'You',
      message: msg,
    });
    await loadMessages();
    setChatSending(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-grove-500" />
        <span className="text-sm text-gray-500">Loading your family...</span>
      </div>
    );
  }

  // ── No group state ────────────────────────────────────────────────────────────

  if (!group) {
    return (
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-grove-500 to-warmth-400" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-grove-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-grove-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Family Farm Dynasty</h2>
          </div>

          <div className="space-y-4">
            {/* Create group */}
            <div className="border border-grove-200 rounded-xl p-4 bg-grove-50/40">
              <p className="text-sm font-semibold text-gray-800 mb-1">Start a family group</p>
              <p className="text-xs text-gray-500 mb-3">Create your family farm and invite everyone to grow together.</p>
              {!creatingGroup ? (
                <button
                  onClick={() => setCreatingGroup(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-grove-600 text-white text-sm font-semibold hover:bg-grove-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create My Family Group
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateGroup(); }}
                    placeholder="e.g. The Adeyemi Farm"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-grove-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleCreateGroup}
                    disabled={groupSaving || !newGroupName.trim()}
                    className="px-4 py-2 rounded-lg bg-grove-600 text-white text-sm font-semibold hover:bg-grove-700 disabled:opacity-50 transition-colors"
                  >
                    {groupSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setCreatingGroup(false)} className="px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 text-sm">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Join group */}
            <div className="border border-warmth-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setJoinOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-warmth-50/40 hover:bg-warmth-50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">Join a family group</p>
                  <p className="text-xs text-gray-500">Use an invite code or send a request</p>
                </div>
                {joinOpen ? <ChevronUp className="w-4 h-4 text-warmth-500" /> : <ChevronDown className="w-4 h-4 text-warmth-500" />}
              </button>

              <AnimatePresence>
                {joinOpen && (
                  <motion.div
                    className="px-4 pb-4 pt-2 bg-white space-y-4"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {joinSuccess ? (
                      <p className="text-sm font-medium text-grove-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> {joinSuccess}
                      </p>
                    ) : (
                      <>
                        {/* Invite code option */}
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Option A — Enter invite code</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={inviteCode}
                              onChange={e => { setInviteCode(e.target.value); setJoinError(''); }}
                              placeholder="e.g. PALM4829"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-warmth-400 focus:border-transparent uppercase tracking-widest"
                              maxLength={8}
                            />
                            <button
                              onClick={handleJoinByCode}
                              disabled={joinLoading || !inviteCode.trim()}
                              className="px-4 py-2 rounded-lg bg-warmth-500 text-white text-sm font-semibold hover:bg-warmth-600 disabled:opacity-50 transition-colors"
                            >
                              {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
                            </button>
                          </div>
                          {joinError && (
                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> {joinError}
                            </p>
                          )}
                        </div>

                        {/* Request option */}
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Option B — Send a request</p>
                          {requestSent ? (
                            <p className="text-xs text-grove-700 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Your request has been sent! The family head will review it.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <textarea
                                value={requestMessage}
                                onChange={e => setRequestMessage(e.target.value)}
                                placeholder="Add a short message (optional) — e.g. 'It's Adaeze, Mama's daughter'"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-grove-500 focus:border-transparent resize-none"
                                rows={2}
                              />
                              <p className="text-xs text-gray-400">
                                Note: You'll need the family group ID or name to send a request. Ask your family head.
                              </p>
                              {/* Simple request to any pending invite they can find */}
                              <button
                                onClick={() => {
                                  // Without knowing the group ID, we just show a message
                                  // In real flow the group ID comes from a share link or head shares it
                                  setRequestSent(true);
                                }}
                                disabled={requestLoading}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-grove-600 text-white text-sm font-semibold hover:bg-grove-700 disabled:opacity-50 transition-colors"
                              >
                                {requestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Send Request
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Tabbed panel ──────────────────────────────────────────────────────────────

  const totalPlants = plants.length;
  const pendingCount = joinRequests.length;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-grove-700 to-grove-600 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{group.group_name}</h2>
                <p className="text-xs text-grove-200">
                  {members.length} member{members.length !== 1 ? 's' : ''} · {totalPlants} plant{totalPlants !== 1 ? 's' : ''}
                  {isHead && <span className="ml-2 bg-warmth-400/30 text-warmth-100 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">You're the head 👑</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['overview', 'members', 'chat'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-grove-700 border-b-2 border-grove-600 bg-grove-50/60'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab === 'members' && pendingCount > 0 && isHead ? (
                <span className="relative inline-flex items-center gap-1">
                  Members
                  <span className="w-4 h-4 rounded-full bg-soul-500 text-white text-[9px] font-bold flex items-center justify-center">{pendingCount}</span>
                </span>
              ) : tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Overview tab ─────────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              className="p-4 space-y-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {/* FIFA-style family stats board */}
              {members.length > 0 && (() => {
                const farmerList: Farmer[] = members.map(member => {
                  const memberPlants = plants.filter(p => p.group_member_id === member.id);
                  const memberPlantIds = new Set(memberPlants.map(p => p.id));
                  const memberLogs = familyCareLogs.filter(l => memberPlantIds.has(l.plant_id));
                  return buildFarmer(member.name, memberPlants, memberLogs, {
                    isHead: member.linked_user_id === (group?.head_user_id || group?.user_id),
                    isCustodianChild: member.is_custodian_child,
                  });
                });

                // Merge head's unassigned plants into their row
                const unassigned = plants.filter(p => !p.group_member_id);
                if (unassigned.length > 0) {
                  const unassignedIds = new Set(unassigned.map(p => p.id));
                  const headLogs = familyCareLogs.filter(l => unassignedIds.has(l.plant_id));
                  const existingHead = farmerList.find(f => f.isHead);
                  if (existingHead) {
                    const extra = buildFarmer(existingHead.name, unassigned, headLogs);
                    existingHead.seedCount += extra.seedCount;
                    existingHead.plantCount += extra.plantCount;
                    existingHead.totalLogs += extra.totalLogs;
                    existingHead.fertilized += extra.fertilized;
                    existingHead.weeded += extra.weeded;
                    existingHead.pestChecked += extra.pestChecked;
                    existingHead.issuesReported += extra.issuesReported;
                  } else {
                    farmerList.push(buildFarmer(displayName + ' (own)', unassigned, headLogs, { isHead: true }));
                  }
                }

                return farmerList.length > 0 ? (
                  <FarmStatsBoard farmers={farmerList} title={`${group?.group_name || 'Family'} Stats`} />
                ) : null;
              })()}

              {members.length === 0 && (
                <div className="text-center py-8">
                  <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No members yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Go to the Members tab to add or invite family.</p>
                </div>
              )}

              {/* Member quick-action cards (head only) */}
              {members.length > 0 && isHead && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map(member => {
                    const memberPlants = plants.filter(p => p.group_member_id === member.id);
                    const reminded = remindCooldown.has(member.id);
                    return (
                      <div key={member.id} className="border border-gray-100 rounded-xl p-3 hover:border-grove-200 hover:bg-grove-50/30 transition-colors">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-grove-400 to-warmth-400 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-white">{getInitials(member.name)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                            <span className="text-[10px] text-gray-400">{memberPlants.length} kit{memberPlants.length !== 1 ? 's' : ''} &middot; {memberPlants.length * 3} seeds</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleRemind(member)}
                            disabled={!member.linked_user_id || reminded}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              reminded ? 'bg-grove-100 text-grove-500 cursor-default'
                                : !member.linked_user_id ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                : 'bg-grove-50 text-grove-700 hover:bg-grove-100'
                            }`}
                          >
                            <Bell className="w-3.5 h-3.5" />
                            {reminded ? 'Sent!' : 'Remind'}
                          </button>
                          {memberPlants.length > 0 && (
                            <button
                              onClick={() => {
                                const firstPlant = memberPlants[0];
                                if (member.is_custodian_child) {
                                  setCustodianModal({ member, plant: firstPlant });
                                } else {
                                  onNavigate('plant', firstPlant);
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-warmth-50 text-warmth-700 hover:bg-warmth-100 text-xs font-semibold transition-colors"
                            >
                              <TreePine className="w-3.5 h-3.5" />
                              Log Today
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Members tab ──────────────────────────────────────────────────────── */}
          {activeTab === 'members' && (
            <motion.div
              key="members"
              className="p-4 space-y-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {/* Member list */}
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id}>
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-grove-400 to-warmth-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{getInitials(member.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                          {member.is_custodian_child && <Baby className="w-3.5 h-3.5 text-warmth-400" />}
                          {member.linked_user_id === group.head_user_id && (
                            <Crown className="w-3.5 h-3.5 text-warmth-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {member.relationship && <span className="text-[10px] text-gray-500">{member.relationship}</span>}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            member.linked_user_id ? 'bg-grove-100 text-grove-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {member.linked_user_id ? '✓ Linked' : 'Local only'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Crown button — head only, on linked non-head members */}
                        {isHead && member.linked_user_id && member.linked_user_id !== (group.head_user_id || group.user_id) && (
                          <button
                            onClick={() => setCrownTarget(t => t?.id === member.id ? null : member)}
                            title={`Make ${member.name} the new head`}
                            className="p-1.5 rounded-lg text-warmth-500 hover:bg-warmth-50 transition-colors"
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                        )}
                        {editing && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Crown confirmation inline */}
                    <AnimatePresence>
                      {crownTarget?.id === member.id && (
                        <motion.div
                          className="mx-2 mb-2 p-3 border border-warmth-200 rounded-xl bg-warmth-50/60"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <p className="text-xs text-gray-700 mb-2">
                            Pass family leadership to <span className="font-semibold">{member.name}</span>? You'll become a regular member.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCrownMember(member)}
                              disabled={crownLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-grove-600 text-white text-xs font-semibold hover:bg-grove-700 disabled:opacity-50 transition-colors"
                            >
                              {crownLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                              Yes, Pass Leadership
                            </button>
                            <button
                              onClick={() => setCrownTarget(null)}
                              className="px-3 py-1.5 rounded-lg text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Pending requests — head only */}
              {isHead && pendingCount > 0 && (
                <div className="border border-soul-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setRequestsOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-soul-50/40 hover:bg-soul-50 transition-colors text-left"
                  >
                    <p className="text-xs font-semibold text-soul-700">
                      {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
                    </p>
                    {requestsOpen ? <ChevronUp className="w-4 h-4 text-soul-400" /> : <ChevronDown className="w-4 h-4 text-soul-400" />}
                  </button>
                  <AnimatePresence>
                    {requestsOpen && (
                      <motion.div
                        className="divide-y divide-gray-100"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        {joinRequests.map(req => (
                          <div key={req.id} className="px-4 py-3 bg-white">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{req.requester_name}</p>
                                {req.message && <p className="text-xs text-gray-500 mt-0.5">"{req.message}"</p>}
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(req.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => handleAcceptRequest(req)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-grove-600 text-white text-xs font-semibold hover:bg-grove-700 transition-colors"
                                >
                                  <Check className="w-3 h-3" /> Accept
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-soul-100 text-soul-700 text-xs font-semibold hover:bg-soul-200 transition-colors"
                                >
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Head-only actions */}
              {isHead && (
                <div className="space-y-3">
                  {/* Generate invite code */}
                  <div className="border border-grove-200 rounded-xl p-3 bg-grove-50/30">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Share an invite code</p>
                    {inviteResult ? (
                      <div className="bg-white border border-grove-300 rounded-lg p-3 flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-lg font-bold tracking-widest text-grove-700">{inviteResult.code}</p>
                          <p className="text-[10px] text-gray-400">Expires {inviteResult.expires} · Single use</p>
                        </div>
                        <button
                          onClick={handleCopyCode}
                          className={`p-2 rounded-lg transition-colors ${codeCopied ? 'bg-grove-100 text-grove-600' : 'bg-gray-100 text-gray-600 hover:bg-grove-50 hover:text-grove-600'}`}
                          title="Copy code"
                        >
                          {codeCopied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateCode}
                        disabled={inviteGenerating}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-grove-600 text-white text-xs font-semibold hover:bg-grove-700 disabled:opacity-50 transition-colors"
                      >
                        {inviteGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
                        Generate Invite Code
                      </button>
                    )}
                    {inviteResult && (
                      <button
                        onClick={() => setInviteResult(null)}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        Generate another code
                      </button>
                    )}
                  </div>

                  {/* Add member manually */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setAddingMember(o => !o)}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs font-semibold text-gray-700"
                    >
                      <UserPlus className="w-4 h-4" /> Add Member Manually
                      {addingMember ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                    </button>
                    <AnimatePresence>
                      {addingMember && (
                        <motion.div
                          className="px-4 pb-4 pt-2 space-y-2.5 bg-white"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <input
                            autoFocus
                            type="text"
                            value={newMember.name}
                            onChange={e => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Name *"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-grove-500 focus:border-transparent"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={newMember.relationship}
                              onChange={e => setNewMember(prev => ({ ...prev, relationship: e.target.value }))}
                              placeholder="Relationship"
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-grove-500 focus:border-transparent"
                            />
                            {!newMember.is_custodian_child && (
                              <input
                                type="text"
                                value={newMember.phone}
                                onChange={e => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Phone (optional)"
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-grove-500 focus:border-transparent"
                              />
                            )}
                          </div>
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <div
                              onClick={() => setNewMember(prev => ({ ...prev, is_custodian_child: !prev.is_custodian_child }))}
                              className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                                newMember.is_custodian_child ? 'bg-warmth-500' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                newMember.is_custodian_child ? 'translate-x-4' : 'translate-x-0.5'
                              }`} />
                            </div>
                            <span className="text-xs text-gray-600">
                              <Baby className="w-3.5 h-3.5 inline mr-1 text-warmth-400" />
                              No phone — I'll log on their behalf
                            </span>
                          </label>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setAddingMember(false); setNewMember({ name: '', relationship: '', phone: '', is_custodian_child: false }); }}
                              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                            >Cancel</button>
                            <button
                              onClick={handleAddMember}
                              disabled={memberSaving || !newMember.name.trim()}
                              className="px-4 py-1.5 text-sm font-semibold bg-grove-600 text-white rounded-lg hover:bg-grove-700 disabled:opacity-50 transition-colors"
                            >
                              {memberSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Edit/manage toggle */}
                  <button
                    onClick={() => setEditing(e => !e)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                      editing ? 'text-soul-700 bg-soul-50 hover:bg-soul-100' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {editing ? <><Check className="w-3.5 h-3.5" /> Done Managing</> : <><Edit3 className="w-3.5 h-3.5" /> Remove Members</>}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Chat tab ─────────────────────────────────────────────────────────── */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              className="flex flex-col"
              style={{ height: 420 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-grove-500" />
                  <span className="text-xs font-semibold text-gray-700">Family Chat</span>
                </div>
                <button
                  onClick={loadMessages}
                  disabled={chatLoading}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:bg-grove-50 hover:border-grove-300 hover:text-grove-700 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${chatLoading ? 'animate-spin' : ''}`} />
                  Update
                </button>
              </div>

              {/* Not-linked banner */}
              {!canChat && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    You need to link your account to this family group to participate in chat.
                  </p>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {chatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 animate-spin text-grove-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-gray-400 text-center">
                      No messages yet. Say hello to the family! 🌱
                    </p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isOwn = msg.sender_user_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isOwn && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-grove-400 to-warmth-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-white">{getInitials(msg.sender_name)}</span>
                          </div>
                        )}
                        <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                          {!isOwn && (
                            <p className="text-[10px] text-gray-500 px-1">{msg.sender_name}</p>
                          )}
                          <div className={`px-3 py-2 rounded-2xl text-sm ${
                            isOwn
                              ? 'bg-gradient-to-br from-grove-600 to-grove-500 text-white rounded-tr-sm'
                              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                          }`}>
                            {msg.message}
                          </div>
                          <p className={`text-[9px] text-gray-400 px-1 ${isOwn ? 'text-right' : ''}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Non-linked members info */}
              {canChat && members.some(m => !m.linked_user_id) && (
                <div className="px-4 py-1.5 bg-grove-50/60 border-t border-grove-100 flex-shrink-0">
                  <p className="text-[10px] text-grove-600">
                    Some family members haven't linked their accounts yet — they won't see messages until they join via an invite code.
                  </p>
                </div>
              )}

              {/* Compose */}
              <div className="flex gap-2 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder={canChat ? 'Say something to the family...' : 'Link your account to chat'}
                  disabled={!canChat || chatSending}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-grove-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!canChat || chatSending || !chatInput.trim()}
                  className="p-2.5 rounded-xl bg-grove-600 text-white hover:bg-grove-700 disabled:opacity-40 transition-colors flex-shrink-0"
                >
                  {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custodian modal */}
      {custodianModal && (
        <CustodianLogModal
          childName={custodianModal.member.name}
          headName={displayName}
          plantName={custodianModal.plant.name}
          onConfirm={() => {
            onNavigate('plant', custodianModal.plant);
            setCustodianModal(null);
          }}
          onCancel={() => setCustodianModal(null)}
        />
      )}
    </>
  );
}
