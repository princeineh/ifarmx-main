import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Leaf, CheckCircle, Key, Clock, ArrowRight,
  Package, Loader2, Calendar, Users, Timer
} from 'lucide-react';

interface ProgramParticipation {
  id: string;
  program_id: string;
  kit_code_assigned: boolean;
  kit_activated: boolean;
  joined_at: string;
  program_name: string;
  program_description: string | null;
  program_status: string;
  start_date: string | null;
  target_participants: number;
  kit_code: string | null;
  org_name: string | null;
  plant_age_days: number | null;
  plant_name: string | null;
  planted_date: string | null;
}

interface MyProgramsProps {
  onNavigate: (page: string, data?: any) => void;
}

export function MyPrograms({ onNavigate }: MyProgramsProps) {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<ProgramParticipation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadPrograms();
  }, [user]);

  const loadPrograms = async () => {
    if (!user) return;

    const { data: participations } = await supabase
      .from('program_participants')
      .select('id, program_id, kit_code_assigned, kit_activated, joined_at, programs(name, description, status, start_date, target_participants, org_user_id)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (!participations || participations.length === 0) {
      setPrograms([]);
      setLoading(false);
      return;
    }

    const orgIds = participations
      .map((p: any) => p.programs?.org_user_id)
      .filter(Boolean);

    const { data: orgProfiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', orgIds);

    const orgMap = new Map((orgProfiles || []).map(o => [o.id, o.display_name]));

    const programIds = participations.map(p => p.program_id);
    const [{ data: codes }, { data: plants }] = await Promise.all([
      supabase
        .from('kit_codes')
        .select('code, program_id')
        .eq('assigned_to_user_id', user.id)
        .in('program_id', programIds),
      supabase
        .from('plants')
        .select('name, planted_date, program_id')
        .eq('user_id', user.id)
        .in('program_id', programIds),
    ]);

    const codeMap = new Map((codes || []).map(c => [c.program_id, c.code]));
    const plantMap = new Map((plants || []).map(p => [p.program_id, p]));

    const rows: ProgramParticipation[] = participations.map((p: any) => {
      const plant = plantMap.get(p.program_id);
      const plantAgeDays = plant
        ? Math.floor((Date.now() - new Date(plant.planted_date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: p.id,
        program_id: p.program_id,
        kit_code_assigned: p.kit_code_assigned,
        kit_activated: p.kit_activated,
        joined_at: p.joined_at,
        program_name: p.programs?.name || 'Unknown Program',
        program_description: p.programs?.description || null,
        program_status: p.programs?.status || 'draft',
        start_date: p.programs?.start_date || null,
        target_participants: p.programs?.target_participants || 0,
        kit_code: codeMap.get(p.program_id) || null,
        org_name: orgMap.get(p.programs?.org_user_id) || null,
        plant_age_days: plantAgeDays,
        plant_name: plant?.name || null,
        planted_date: plant?.planted_date || null,
      };
    });

    setPrograms(rows);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  const pendingPrograms = programs.filter(p => !p.kit_activated);

  if (pendingPrograms.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Leaf className="w-5 h-5 text-emerald-600" />
        <h2 className="text-lg font-bold text-gray-900">My Programs</h2>
      </div>
      <div className="space-y-3">
        {pendingPrograms.map((p) => {
          const getStatus = () => {
            if (p.kit_activated) return { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle };
            if (p.kit_code_assigned) return { label: 'Kit Ready', color: 'bg-blue-100 text-blue-700', icon: Key };
            return { label: 'Accepted', color: 'bg-amber-100 text-amber-700', icon: Clock };
          };

          const status = getStatus();
          const StatusIcon = status.icon;

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900 text-sm">{p.program_name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    {p.org_name && (
                      <p className="text-xs text-gray-500">by {p.org_name}</p>
                    )}
                    {p.program_description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.program_description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  {p.start_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Starts {new Date(p.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {p.target_participants} participants
                  </span>
                  <span>
                    Joined {new Date(p.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {p.kit_code_assigned && !p.kit_activated && p.kit_code && (
                  <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                    <div>
                      <p className="text-xs font-semibold text-amber-800 mb-1">Your Kit Code</p>
                      <p className="font-mono font-bold text-amber-900 tracking-wider">{p.kit_code}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('activate', p.kit_code);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-bold hover:from-amber-600 hover:to-amber-700 transition-all shadow-sm flex-shrink-0"
                    >
                      <Package className="w-4 h-4" />
                      Activate Now
                    </button>
                  </div>
                )}

                {!p.kit_code_assigned && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-600">
                      Your organizer will assign your kit soon. You'll be notified when it's ready.
                    </p>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
