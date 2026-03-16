import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users, User, Package, CheckCircle, Clock, Send,
  Zap, AlertCircle, Key, Loader2, Hash
} from 'lucide-react';

interface ParticipantRow {
  participant_id: string;
  user_id: string;
  display_name: string | null;
  state_of_origin: string | null;
  kit_code_assigned: boolean;
  kit_activated: boolean;
  kit_code: string | null;
  joined_at: string;
}

interface ParticipantsListProps {
  programId: string;
  orgUserId: string;
  programName: string;
  onKitsChanged: () => Promise<void>;
  onNavigate: (page: string, data?: any) => void;
}

function generateKitCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PALM-${seg()}-${seg()}`;
}

export function ParticipantsList({
  programId,
  orgUserId,
  programName,
  onKitsChanged,
  onNavigate,
}: ParticipantsListProps) {
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingCodeTo, setSendingCodeTo] = useState<string | null>(null);
  const [assignCount, setAssignCount] = useState<number>(0);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  useEffect(() => {
    loadParticipants();
  }, [programId]);

  const loadParticipants = async () => {
    setLoading(true);

    const { data: parts } = await supabase
      .from('program_participants')
      .select('id, user_id, kit_code_assigned, kit_activated, joined_at')
      .eq('program_id', programId)
      .order('joined_at', { ascending: false });

    if (!parts || parts.length === 0) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    const userIds = parts.map(p => p.user_id);

    const [profilesRes, codesRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, display_name, state_of_origin')
        .in('id', userIds),
      supabase
        .from('kit_codes')
        .select('code, assigned_to_user_id')
        .eq('program_id', programId)
        .in('assigned_to_user_id', userIds),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const codeMap = new Map((codesRes.data || []).map(c => [c.assigned_to_user_id, c.code]));

    const rows: ParticipantRow[] = parts.map(p => {
      const prof = profileMap.get(p.user_id);
      return {
        participant_id: p.id,
        user_id: p.user_id,
        display_name: prof?.display_name || null,
        state_of_origin: prof?.state_of_origin || null,
        kit_code_assigned: p.kit_code_assigned,
        kit_activated: p.kit_activated,
        kit_code: codeMap.get(p.user_id) || null,
        joined_at: p.joined_at,
      };
    });

    setParticipants(rows);
    const unassigned = rows.filter(p => !p.kit_code_assigned).length;
    setAssignCount(unassigned);
    setLoading(false);
  };

  const handleGenerateAndAssign = async () => {
    if (assignCount <= 0) return;
    setAssigning(true);
    setMessage(null);

    const unassigned = participants.filter(p => !p.kit_code_assigned);
    const toAssign = unassigned.slice(0, assignCount);

    if (toAssign.length === 0) {
      setMessage({ text: 'All participants already have kits assigned.', type: 'warning' });
      setAssigning(false);
      return;
    }

    let assigned = 0;
    for (const participant of toAssign) {
      const code = generateKitCode();

      const { error: insertErr } = await supabase.from('kit_codes').insert({
        code,
        program_id: programId,
        used: false,
        assigned_to_user_id: participant.user_id,
        assigned_by_org_id: orgUserId,
        assignment_date: new Date().toISOString(),
      });

      if (insertErr) continue;

      await supabase
        .from('program_participants')
        .update({ kit_code_assigned: true })
        .eq('id', participant.participant_id);

      await supabase.from('notifications').insert({
        user_id: participant.user_id,
        type: 'program_update',
        title: 'Your Kit Activation Code is Ready',
        message: `Your kit code for "${programName}" is: ${code}. Go to your dashboard to activate your kit and start farming!`,
        metadata: { link_type: 'activate_kit', link_id: code },
        read: false,
      });

      assigned++;
    }

    setMessage({
      text: `Successfully generated and assigned ${assigned} kit${assigned !== 1 ? 's' : ''}.`,
      type: 'success',
    });

    await onKitsChanged();
    await loadParticipants();
    setAssigning(false);
  };

  const handleAutoAssignAll = async () => {
    const unassigned = participants.filter(p => !p.kit_code_assigned);
    setAssignCount(unassigned.length);
    setTimeout(() => handleGenerateAndAssign(), 0);
  };

  const sendCodeNotification = async (participant: ParticipantRow) => {
    if (!participant.kit_code) return;
    setSendingCodeTo(participant.user_id);

    await supabase.from('notifications').insert({
      user_id: participant.user_id,
      type: 'program_update',
      title: 'Your Kit Activation Code is Ready',
      message: `Your kit code for "${programName}" is: ${participant.kit_code}. Go to your dashboard to activate your kit and start farming!`,
      metadata: { link_type: 'activate_kit', link_id: participant.kit_code },
      read: false,
    });

    setSendingCodeTo(null);
  };

  const getStatusBadge = (p: ParticipantRow) => {
    if (p.kit_activated) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      );
    }
    if (p.kit_code_assigned) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
          <Key className="w-3 h-3" />
          Code Sent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
        <Clock className="w-3 h-3" />
        Awaiting Kit
      </span>
    );
  };

  const activeCount = participants.filter(p => p.kit_activated).length;
  const assignedCount = participants.filter(p => p.kit_code_assigned && !p.kit_activated).length;
  const awaitingCount = participants.filter(p => !p.kit_code_assigned).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {participants.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {activeCount} active
          </span>
          <span className="inline-flex items-center gap-1 text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {assignedCount} code sent
          </span>
          <span className="inline-flex items-center gap-1 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {awaitingCount} awaiting kit
          </span>
        </div>
      )}

      {awaitingCount > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-900 mb-3">
            {awaitingCount} participant{awaitingCount !== 1 ? 's' : ''} need kit codes
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-[160px]">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={assignCount}
                  onChange={(e) => setAssignCount(Math.max(0, Math.min(awaitingCount, parseInt(e.target.value) || 0)))}
                  min={1}
                  max={awaitingCount}
                  className="w-full pl-9 pr-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                  placeholder="Number"
                />
              </div>
              <button
                onClick={handleGenerateAndAssign}
                disabled={assigning || assignCount <= 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50"
              >
                {assigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
                Assign {assignCount} Kit{assignCount !== 1 ? 's' : ''}
              </button>
            </div>
            <button
              onClick={handleAutoAssignAll}
              disabled={assigning}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              Assign All ({awaitingCount})
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No participants yet. Accept applications or share invite codes.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {participants.map((p) => (
            <div
              key={p.participant_id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-emerald-700" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-900 text-sm truncate">
                    {p.display_name || 'Unknown User'}
                  </span>
                  {getStatusBadge(p)}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {p.state_of_origin && <span>{p.state_of_origin}</span>}
                  <span>Joined {new Date(p.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  {p.kit_code && (
                    <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {p.kit_code}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {p.kit_code_assigned && !p.kit_activated && (
                  <button
                    onClick={() => sendCodeNotification(p)}
                    disabled={sendingCodeTo === p.user_id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition-colors disabled:opacity-50"
                  >
                    {sendingCodeTo === p.user_id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    Resend Code
                  </button>
                )}
                {p.kit_activated && (
                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    Kit Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {participants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
          <button
            onClick={() => onNavigate('participant-monitor', programId)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-200"
          >
            View Detailed Monitor
          </button>
        </div>
      )}
    </div>
  );
}
