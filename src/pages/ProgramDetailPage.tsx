import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Globe, Lock, Users, CheckCircle, XCircle,
  Plus, Minus, Copy, AlertCircle, BarChart3, Send,
  Trash2, StopCircle, Loader2
} from 'lucide-react';
import type { Program } from '../types/database';
import { ApplicantFilters, type FilterValues } from '../components/program/ApplicantFilters';
import { ApplicantList, type ApplicantRow } from '../components/program/ApplicantList';
import { ParticipantsList } from '../components/program/ParticipantsList';
import { ApplicantDetailDrawer } from '../components/program/ApplicantDetailDrawer';
import { EncourageModal } from '../components/program/EncourageModal';
import { AGE_BRACKETS } from '../data/nigerianStates';

interface ProgramDetailPageProps {
  programId: string;
  onNavigate: (page: string, data?: any) => void;
}

export function ProgramDetailPage({ programId, onNavigate }: ProgramDetailPageProps) {
  const { user, loading: authLoading } = useAuth();
  const [program, setProgram] = useState<Program | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [participantCount, setParticipantCount] = useState(0);
  const [kitsAssigned, setKitsAssigned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteExpDays, setInviteExpDays] = useState(30);
  const [invites, setInvites] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'participants' | 'invites'>('applications');
  const [filters, setFilters] = useState<FilterValues>({ states: [], ageBracket: '', occupation: '', gender: '', disability: '', healthChallenge: '', locationSearch: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [viewingApplicant, setViewingApplicant] = useState<ApplicantRow | null>(null);
  const [encourageTarget, setEncourageTarget] = useState<{ userId: string; name: string } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [showKitReview, setShowKitReview] = useState(false);
  const [kitAdjustments, setKitAdjustments] = useState<Record<string, number>>({});

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      setLoadError(true);
      return;
    }

    loadAll();
  }, [programId, user, authLoading]);

  const loadAll = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      await Promise.all([loadProgram(), loadApplicants(), loadParticipantCount(), loadInvites()]);
    } catch (err) {
      console.error('Error in loadAll:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadProgram = async () => {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .maybeSingle();

    if (error) {
      setLoadError(true);
    } else if (data) {
      setProgram(data);
    } else {
      setLoadError(true);
    }
  };

  const loadApplicants = async () => {
    const { data: apps } = await supabase
      .from('program_applications')
      .select('*')
      .eq('program_id', programId)
      .eq('status', 'pending')
      .order('applied_at', { ascending: false });

    if (!apps || apps.length === 0) {
      setApplicants([]);
      return;
    }

    const userIds = apps.map(a => a.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, state_of_origin, lga, location, date_of_birth, occupation, gender, disabilities, health_challenge')
      .in('id', userIds);

    const { data: plants } = await supabase
      .from('plants')
      .select('user_id')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const usersWithPlants = new Set((plants || []).map(p => p.user_id));

    const rows: ApplicantRow[] = apps.map(app => {
      const prof = profileMap.get(app.user_id);
      return {
        application_id: app.id,
        user_id: app.user_id,
        display_name: prof?.display_name || null,
        email: '',
        state_of_origin: prof?.state_of_origin || null,
        lga: prof?.lga || null,
        location: prof?.location || null,
        date_of_birth: prof?.date_of_birth || null,
        occupation: prof?.occupation || null,
        gender: prof?.gender || null,
        disabilities: prof?.disabilities || null,
        health_challenge: prof?.health_challenge || null,
        applied_at: app.applied_at,
        status: app.status,
        is_platform_user: !!prof,
        has_plants: usersWithPlants.has(app.user_id),
        requested_kits: app.requested_kits ?? 1,
      };
    });

    setApplicants(rows);
  };

  const loadParticipantCount = async () => {
    const [partRes, kitsRes] = await Promise.all([
      supabase.from('program_participants').select('id', { count: 'exact', head: true }).eq('program_id', programId),
      supabase.from('program_participants').select('id', { count: 'exact', head: true }).eq('program_id', programId).eq('kit_code_assigned', true),
    ]);
    setParticipantCount(partRes.count || 0);
    setKitsAssigned(kitsRes.count || 0);
  };

  const loadInvites = async () => {
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('program_id', programId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setInvites(data);
  };

  const togglePublish = async () => {
    if (!program || !user) return;
    setActionLoading(true);
    const newStatus = program.status === 'published' ? 'draft' : 'published';
    await supabase.from('programs').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', programId);
    await loadProgram();
    setActionLoading(false);
  };

  const toggleAcceptanceType = async () => {
    if (!program || !user) return;
    setActionLoading(true);
    const newType = program.acceptance_type === 'open' ? 'invite_only' : 'open';
    await supabase.from('programs').update({ acceptance_type: newType, updated_at: new Date().toISOString() }).eq('id', programId);
    await loadProgram();
    setActionLoading(false);
  };

  const handleAcceptSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    setActionLoading(true);

    const remaining = (program?.target_participants || 0) - participantCount;
    const toAccept = Array.from(selectedIds).slice(0, remaining);

    for (const appId of toAccept) {
      const app = applicants.find(a => a.application_id === appId);
      if (!app) continue;

      await supabase
        .from('program_applications')
        .update({ status: 'accepted', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
        .eq('id', appId);

      await supabase
        .from('program_participants')
        .insert({
          program_id: programId,
          user_id: app.user_id,
          status: 'active',
          application_id: appId,
          kit_code_assigned: false,
          kit_activated: false,
        });

      await supabase.from('notifications').insert({
        user_id: app.user_id,
        type: 'program_update',
        title: 'Application Accepted!',
        message: `Your application to "${program?.name}" has been approved. You are now a participant! Your organizer will assign a kit to you soon.`,
        metadata: { link_type: 'program', link_id: programId },
        read: false,
      });
    }

    if (toAccept.length < selectedIds.size) {
      const rejected = Array.from(selectedIds).slice(remaining);
      for (const appId of rejected) {
        const app = applicants.find(a => a.application_id === appId);
        await supabase
          .from('program_applications')
          .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
          .eq('id', appId);

        if (app) {
          await supabase.from('notifications').insert({
            user_id: app.user_id,
            type: 'program_update',
            title: 'Application Update',
            message: `Your application to "${program?.name}" was not approved at this time. You can explore other open programs in the Trade Centre.`,
            metadata: { link_type: 'program', link_id: programId },
            read: false,
          });
        }
      }
    }

    setSelectedIds(new Set());
    await Promise.all([loadApplicants(), loadParticipantCount()]);

    const newCount = participantCount + toAccept.length;
    if (newCount >= (program?.target_participants || 0)) {
      await supabase.from('programs').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', programId);
      await loadProgram();
      if (user) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'program_update',
          title: 'Program Full - Auto-Closed',
          message: `"${program?.name}" has reached its target of ${program?.target_participants} participants and has been automatically closed. No more applications will be accepted.`,
          read: false,
        });
      }
    }

    setActionLoading(false);
  };

  const handleRejectSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    setActionLoading(true);

    for (const appId of Array.from(selectedIds)) {
      const app = applicants.find(a => a.application_id === appId);
      await supabase
        .from('program_applications')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
        .eq('id', appId);

      if (app) {
        await supabase.from('notifications').insert({
          user_id: app.user_id,
          type: 'program_update',
          title: 'Application Update',
          message: `Your application to "${program?.name}" was not approved at this time. You can explore other open programs in the Trade Centre.`,
          metadata: { link_type: 'program', link_id: programId },
          read: false,
        });
      }
    }

    setSelectedIds(new Set());
    await loadApplicants();
    setActionLoading(false);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program) return;
    setActionLoading(true);

    const code = `ORG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + inviteExpDays);

    await supabase.from('invites').insert({
      program_id: programId,
      code,
      email: inviteEmail || null,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    setShowInviteForm(false);
    setInviteEmail('');
    setInviteExpDays(30);
    await loadInvites();
    setActionLoading(false);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteProgram = async () => {
    if (!user || !program) return;
    setActionLoading(true);
    await supabase.from('programs').delete().eq('id', programId).eq('org_user_id', user.id);
    setActionLoading(false);
    onNavigate('organization');
  };

  const handleEndProgram = async () => {
    if (!user || !program) return;
    setActionLoading(true);
    await supabase.from('programs').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', programId);

    const { data: participants } = await supabase
      .from('program_participants')
      .select('user_id')
      .eq('program_id', programId);

    if (participants && participants.length > 0) {
      const notifs = participants.map(p => ({
        user_id: p.user_id,
        type: 'program_update',
        title: 'Program Ended',
        message: `The program "${program.name}" has been closed by the organizer. You can continue caring for your existing plants. Thank you for being part of this program!`,
        read: false,
      }));
      const batchSize = 500;
      for (let i = 0; i < notifs.length; i += batchSize) {
        await supabase.from('notifications').insert(notifs.slice(i, i + batchSize));
      }
    }

    await loadProgram();
    setShowEndConfirm(false);
    setActionLoading(false);
  };

  const getFilteredApplicants = useCallback(() => {
    return applicants.filter(a => {
      if (filters.states.length > 0 && (!a.state_of_origin || !filters.states.includes(a.state_of_origin))) return false;

      if (filters.ageBracket && a.date_of_birth) {
        const bracket = AGE_BRACKETS.find(b => b.label === filters.ageBracket);
        if (bracket) {
          const birth = new Date(a.date_of_birth);
          const now = new Date();
          let age = now.getFullYear() - birth.getFullYear();
          const m = now.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
          if (age < bracket.min || age > bracket.max) return false;
        }
      } else if (filters.ageBracket && !a.date_of_birth) {
        return false;
      }

      if (filters.occupation && a.occupation !== filters.occupation) return false;
      if (filters.gender && a.gender !== filters.gender) return false;
      if (filters.disability && a.disabilities !== filters.disability) return false;
      if (filters.healthChallenge && a.health_challenge !== filters.healthChallenge) return false;

      if (filters.locationSearch) {
        const search = filters.locationSearch.toLowerCase();
        const matchesLga = a.lga?.toLowerCase().includes(search);
        const matchesLoc = a.location?.toLowerCase().includes(search);
        if (!matchesLga && !matchesLoc) return false;
      }

      return true;
    });
  }, [applicants, filters]);

  const filteredApplicants = getFilteredApplicants();

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredApplicants.map(a => a.application_id)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading program details...</p>
          <p className="text-xs text-gray-400 mt-2">Program ID: {programId}</p>
        </div>
      </div>
    );
  }

  if (loadError || !program) {
    return (
      <div className="min-h-screen mud-texture adinkra-bg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button
            onClick={() => onNavigate('organization')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Programs
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Program Not Found</h2>
            <p className="text-gray-600 mb-4">
              Unable to load this program. It may have been deleted or you don't have permission to view it.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left text-xs space-y-1">
              <p><strong>Program ID:</strong> {programId}</p>
              <p><strong>Your User ID:</strong> {user?.id}</p>
              <p><strong>Debug:</strong> Check browser console (F12) for detailed error logs</p>
            </div>
            <button
              onClick={() => onNavigate('organization')}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Programs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const remaining = program.target_participants - participantCount;
  const progressPct = Math.min(100, (participantCount / program.target_participants) * 100);

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={() => onNavigate('organization')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Programs
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{program.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  program.status === 'published' ? 'bg-green-100 text-green-700' :
                  program.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                </span>
              </div>
              {program.description && <p className="text-sm text-gray-500">{program.description}</p>}
              <p className="text-xs text-gray-400 mt-1">
                Target: {program.target_participants} participants
                {program.start_date && ` | Start: ${new Date(program.start_date).toLocaleDateString()}`}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={toggleAcceptanceType}
                disabled={actionLoading || program.status === 'closed'}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  program.acceptance_type === 'open'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {program.acceptance_type === 'open' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {program.acceptance_type === 'open' ? 'Open' : 'Invite Only'}
              </button>

              {program.status !== 'closed' && (
                <button
                  onClick={togglePublish}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    program.status === 'published'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                  }`}
                >
                  {program.status === 'published' ? 'Unpublish' : 'Publish Program'}
                </button>
              )}

              <button
                onClick={() => onNavigate('participant-monitor', programId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-sm font-semibold transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                Monitor
              </button>

              {program.status !== 'closed' && (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-sm font-semibold transition-all"
                >
                  <StopCircle className="w-4 h-4" />
                  End Program
                </button>
              )}

              {program.status === 'draft' && participantCount === 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">{participantCount}</p>
              <p className="text-[11px] text-gray-500">Participants</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-700">{applicants.length}</p>
              <p className="text-[11px] text-gray-500">Pending Apps</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{kitsAssigned}</p>
              <p className="text-[11px] text-gray-500">Kits Assigned</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-700">{remaining > 0 ? remaining : 0}</p>
              <p className="text-[11px] text-gray-500">Spots Left</p>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2.5 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{Math.round(progressPct)}% of target capacity filled</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'applications' ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Applications ({applicants.length})
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'participants' ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Participants ({participantCount})
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'invites' ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Invite Codes ({invites.length})
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'applications' && (
              <div>
                {program.acceptance_type !== 'open' && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Switch to "Open" acceptance to allow users to apply to this program.
                  </div>
                )}

                <ApplicantFilters
                  filters={filters}
                  onChange={setFilters}
                  matchCount={filteredApplicants.length}
                  totalCount={applicants.length}
                />

                <ApplicantList
                  applicants={filteredApplicants}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onSelectAll={selectAllFiltered}
                  onDeselectAll={() => setSelectedIds(new Set())}
                  onViewApplicant={setViewingApplicant}
                />

                {selectedIds.size > 0 && (
                  <div className="mt-4 sticky bottom-4 bg-white border border-gray-200 rounded-xl p-4 shadow-lg flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      {selectedIds.size} applicant{selectedIds.size !== 1 ? 's' : ''} selected
                      {remaining < selectedIds.size && (
                        <span className="text-amber-600 ml-2">(only {remaining} spots left)</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRejectSelected}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-all inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={handleAcceptSelected}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all inline-flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept & Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'participants' && (
              <ParticipantsList
                programId={programId}
                orgUserId={user?.id || ''}
                programName={program.name}
                onKitsChanged={loadParticipantCount}
                onNavigate={onNavigate}
              />
            )}

            {activeTab === 'invites' && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create Invite Code
                  </button>
                </div>

                {showInviteForm && (
                  <form onSubmit={handleCreateInvite} className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="participant@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expires in (days)</label>
                        <input
                          type="number"
                          value={inviteExpDays}
                          onChange={(e) => setInviteExpDays(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          min="1" max="365"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 inline-flex items-center gap-1.5">
                        <Send className="w-4 h-4" />
                        Generate
                      </button>
                      <button type="button" onClick={() => setShowInviteForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {invites.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Send className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No invite codes yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-mono font-semibold text-gray-900 text-sm">{invite.code}</p>
                          <p className="text-xs text-gray-500">
                            {invite.used ? (
                              <span className="text-green-600 font-medium">Used</span>
                            ) : (
                              <>Expires: {new Date(invite.expires_at).toLocaleDateString()}</>
                            )}
                            {invite.email && ` | ${invite.email}`}
                          </p>
                        </div>
                        {!invite.used && (
                          <button onClick={() => copyToClipboard(invite.code)} className="ml-3 p-2 text-gray-500 hover:text-emerald-600">
                            {copiedCode === invite.code ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewingApplicant && (
        <ApplicantDetailDrawer
          userId={viewingApplicant.user_id}
          displayName={viewingApplicant.display_name}
          email={viewingApplicant.email}
          stateOfOrigin={viewingApplicant.state_of_origin}
          lga={viewingApplicant.lga}
          location={viewingApplicant.location}
          dateOfBirth={viewingApplicant.date_of_birth}
          occupation={viewingApplicant.occupation}
          appliedAt={viewingApplicant.applied_at}
          isPlatformUser={viewingApplicant.is_platform_user}
          hasPlants={viewingApplicant.has_plants}
          onClose={() => setViewingApplicant(null)}
          onSendEncouragement={(uid, name) => {
            setViewingApplicant(null);
            setEncourageTarget({ userId: uid, name });
          }}
        />
      )}

      {encourageTarget && program && (
        <EncourageModal
          recipientUserId={encourageTarget.userId}
          recipientName={encourageTarget.name}
          programId={programId}
          programName={program.name}
          onClose={() => setEncourageTarget(null)}
          onSent={() => setEncourageTarget(null)}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Program?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete "{program.name}" and all associated data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProgram}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 inline-flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <StopCircle className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">End Program?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will close "{program.name}" and stop accepting new applications. Existing participants can continue their activities.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEndProgram}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 inline-flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
                End Program
              </button>
            </div>
          </div>
        </div>
      )}

      {showKitReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowKitReview(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-6 py-5 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">Review Kit Quantities</h2>
              <p className="text-emerald-200 text-sm mt-1">
                Adjust the number of kits to approve for each applicant before accepting.
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              {Array.from(selectedIds).map(appId => {
                const app = applicants.find(a => a.application_id === appId);
                if (!app) return null;
                const approved = kitAdjustments[appId] ?? app.requested_kits;
                const minKits = program?.min_kits_per_participant || 1;
                const maxKits = app.requested_kits;

                return (
                  <div key={appId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {app.display_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Requested: {app.requested_kits} kit{app.requested_kits !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setKitAdjustments(prev => ({
                          ...prev,
                          [appId]: Math.max(minKits, approved - 1),
                        }))}
                        disabled={approved <= minKits}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-lg font-bold text-emerald-700 w-8 text-center">{approved}</span>
                      <button
                        onClick={() => setKitAdjustments(prev => ({
                          ...prev,
                          [appId]: Math.min(maxKits, approved + 1),
                        }))}
                        disabled={approved >= maxKits}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setShowKitReview(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptSelected}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {actionLoading ? 'Processing...' : 'Confirm & Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
