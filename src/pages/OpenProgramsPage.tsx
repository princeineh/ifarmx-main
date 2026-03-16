import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../services/analytics';
import {
  ArrowLeft, Globe, Users, Calendar, CheckCircle,
  Clock, Send, AlertCircle, Leaf, Key
} from 'lucide-react';

interface OpenProgramsPageProps {
  onNavigate: (page: string, data?: any) => void;
}

interface PublicProgram {
  id: string;
  name: string;
  description: string | null;
  target_participants: number;
  start_date: string | null;
  org_name: string | null;
  participant_count: number;
  user_applied: boolean;
  application_status: string | null;
  is_participant: boolean;
  kit_code_assigned: boolean;
  kit_activated: boolean;
}

export function OpenProgramsPage({ onNavigate }: OpenProgramsPageProps) {
  const { user, profile } = useAuth();
  const [programs, setPrograms] = useState<PublicProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [applyingModal, setApplyingModal] = useState<PublicProgram | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    if (user) loadPrograms();
  }, [user]);

  const loadPrograms = async () => {
    if (!user) return;

    const { data: publishedPrograms } = await supabase
      .from('programs')
      .select('id, name, description, target_participants, min_kits_per_participant, max_kits_per_participant, start_date, org_user_id')
      .eq('status', 'published')
      .eq('acceptance_type', 'open')
      .order('created_at', { ascending: false });

    if (!publishedPrograms || publishedPrograms.length === 0) {
      setPrograms([]);
      setLoading(false);
      return;
    }

    const orgIds = [...new Set(publishedPrograms.map(p => p.org_user_id))];
    const { data: orgProfiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', orgIds);

    const orgMap = new Map((orgProfiles || []).map(p => [p.id, p.display_name]));

    const [{ data: myApps }, { data: myParticipations }] = await Promise.all([
      supabase
        .from('program_applications')
        .select('program_id, status')
        .eq('user_id', user.id),
      supabase
        .from('program_participants')
        .select('program_id, kit_code_assigned, kit_activated')
        .eq('user_id', user.id),
    ]);

    const appMap = new Map((myApps || []).map(a => [a.program_id, a.status]));
    const partMap = new Map((myParticipations || []).map(p => [p.program_id, p]));

    const result: PublicProgram[] = [];

    for (const prog of publishedPrograms) {
      const { count } = await supabase
        .from('program_participants')
        .select('id', { count: 'exact', head: true })
        .eq('program_id', prog.id);

      const pCount = count || 0;
      const spots = prog.target_participants - pCount;
      if (spots <= 0) continue;

      const participation = partMap.get(prog.id);
      if (participation?.kit_activated) continue;

      result.push({
        id: prog.id,
        name: prog.name,
        description: prog.description,
        target_participants: prog.target_participants,
        min_kits_per_participant: prog.min_kits_per_participant || 1,
        max_kits_per_participant: prog.max_kits_per_participant || 1,
        start_date: prog.start_date,
        org_name: orgMap.get(prog.org_user_id) || 'Organization',
        participant_count: pCount,
        user_applied: appMap.has(prog.id) || !!participation,
        application_status: participation ? 'accepted' : (appMap.get(prog.id) || null),
        is_participant: !!participation,
        kit_code_assigned: participation?.kit_code_assigned || false,
        kit_activated: participation?.kit_activated || false,
      });
    }

    setPrograms(result);

    const incomplete = !profile?.state_of_origin || !profile?.occupation || !profile?.date_of_birth;
    setProfileIncomplete(incomplete);

    setLoading(false);
  };

  const handleApply = async (programId: string) => {
    if (!user) return;
    setApplying(programId);

    const { error } = await supabase
      .from('program_applications')
      .insert({
        program_id: programId,
        user_id: user.id,
        status: 'pending',
        reviewed_at: null,
        reviewed_by: null,
        notes: null,
      });

    if (!error) {
      trackEvent('apply_program', 'open-programs', user.id, { program_id: programId });
      setPrograms(prev => prev.map(p =>
        p.id === programId ? { ...p, user_applied: true, application_status: 'pending' } : p
      ));
    }

    setApplying(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Open Programs</h1>
          <p className="text-gray-500 text-sm">Browse and apply to farming programs accepting new participants.</p>
        </div>

        {profileIncomplete && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Complete Your Profile</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Organizations may filter applicants by state, age, and occupation. Complete your profile to increase your chances of being selected.
              </p>
            </div>
          </div>
        )}

        {programs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Open Programs</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              There are no programs accepting applications right now. Check back later or ask your organization for an invite code.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((prog) => {
              const spots = prog.target_participants - prog.participant_count;
              const fillPct = Math.round((prog.participant_count / prog.target_participants) * 100);

              return (
                <div key={prog.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{prog.name}</h3>
                      <p className="text-xs text-gray-400">by {prog.org_name}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                      <Globe className="w-3 h-3" />
                      Open
                    </span>
                  </div>

                  {prog.description && (
                    <p className="text-sm text-gray-600 mb-3">{prog.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {spots} spot{spots !== 1 ? 's' : ''} remaining
                    </span>
                    {prog.max_kits_per_participant > 1 && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <Package className="w-3.5 h-3.5" />
                        {prog.min_kits_per_participant}-{prog.max_kits_per_participant} kits per person
                      </span>
                    )}
                    {prog.start_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Starts {new Date(prog.start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>

                  {prog.is_participant ? (
                    <div className="inline-flex items-center gap-2">
                      {prog.kit_activated ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700">
                          <Leaf className="w-4 h-4" /> Farming Active
                        </span>
                      ) : prog.kit_code_assigned ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700">
                          <Key className="w-4 h-4" /> Kit Ready - Activate Now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700">
                          <CheckCircle className="w-4 h-4" /> Accepted - Awaiting Kit
                        </span>
                      )}
                    </div>
                  ) : prog.user_applied ? (
                    <div>
                      {prog.application_status === 'accepted' ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700">
                          <CheckCircle className="w-4 h-4" /> Accepted - Awaiting Kit
                        </span>
                      ) : prog.application_status === 'rejected' ? (
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600">
                            <AlertCircle className="w-4 h-4" /> Not selected this time
                          </span>
                          <p className="text-xs text-gray-500">You can apply again when the next round opens.</p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-100 text-amber-700">
                          <Clock className="w-4 h-4" /> Application Under Review
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (prog.max_kits_per_participant > 1) {
                          setApplyingModal(prog);
                        } else {
                          handleApply(prog.id);
                        }
                      }}
                      disabled={applying === prog.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {applying === prog.id ? 'Applying...' : 'Apply Now'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {applyingModal && (
        <ProgramApplicationModal
          program={{
            id: applyingModal.id,
            name: applyingModal.name,
            description: applyingModal.description,
            org_name: applyingModal.org_name,
            target_participants: applyingModal.target_participants,
            participant_count: applyingModal.participant_count,
            start_date: applyingModal.start_date,
            min_kits_per_participant: applyingModal.min_kits_per_participant,
            max_kits_per_participant: applyingModal.max_kits_per_participant,
          }}
          onClose={() => setApplyingModal(null)}
          onApplied={() => {
            setApplyingModal(null);
            loadPrograms();
          }}
        />
      )}
    </div>
  );
}
