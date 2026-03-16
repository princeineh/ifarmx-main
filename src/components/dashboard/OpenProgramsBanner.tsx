import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Globe, Users, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface OpenProgram {
  id: string;
  name: string;
  org_name: string;
  spots_left: number;
  target_participants: number;
  participant_count: number;
}

interface OpenProgramsBannerProps {
  userId: string;
  onNavigate: (page: string, data?: any) => void;
}

export function OpenProgramsBanner({ userId, onNavigate }: OpenProgramsBannerProps) {
  const [programs, setPrograms] = useState<OpenProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    loadPrograms();
  }, [userId]);

  const loadPrograms = async () => {
    const { data: published } = await supabase
      .from('programs')
      .select('id, name, target_participants, org_user_id')
      .eq('status', 'published')
      .eq('acceptance_type', 'open')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!published || published.length === 0) {
      setLoading(false);
      return;
    }

    const orgIds = [...new Set(published.map(p => p.org_user_id))];
    const { data: orgProfiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', orgIds);
    const orgMap = new Map((orgProfiles || []).map(p => [p.id, p.display_name]));

    const result: OpenProgram[] = [];
    for (const prog of published) {
      const { count } = await supabase
        .from('program_participants')
        .select('id', { count: 'exact', head: true })
        .eq('program_id', prog.id);

      const pCount = count || 0;
      const spots = prog.target_participants - pCount;
      if (spots <= 0) continue;

      result.push({
        id: prog.id,
        name: prog.name,
        org_name: orgMap.get(prog.org_user_id) || 'Organization',
        spots_left: spots,
        target_participants: prog.target_participants,
        participant_count: pCount,
      });
    }

    setPrograms(result);
    setLoading(false);
  };

  if (loading || programs.length === 0) return null;

  const current = programs[activeIndex];
  const fillPct = Math.round((current.participant_count / current.target_participants) * 100);

  const goNext = () => setActiveIndex((prev) => (prev + 1) % programs.length);
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + programs.length) % programs.length);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-green-700 shadow-lg">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
      </div>

      <div className="relative px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Free Kit Opportunity</p>
              <p className="text-emerald-100 text-[11px]">{programs.length} open program{programs.length !== 1 ? 's' : ''} available</p>
            </div>
          </div>
          {programs.length > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={goPrev} className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 text-white" />
              </button>
              <span className="text-[10px] text-white/70 font-medium px-1">{activeIndex + 1}/{programs.length}</span>
              <button onClick={goNext} className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-bold text-white text-base truncate">{current.name}</h3>
              <p className="text-emerald-200 text-xs">by {current.org_name}</p>
            </div>
            <span className="flex-shrink-0 inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              <Globe className="w-3 h-3" /> Open
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-emerald-100 mb-3">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {current.spots_left} spot{current.spots_left !== 1 ? 's' : ''} left
            </span>
            <span>{current.participant_count} / {current.target_participants} joined</span>
          </div>

          <div className="w-full bg-white/20 rounded-full h-1.5 mb-3">
            <div
              className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${fillPct}%` }}
            />
          </div>

          <button
            onClick={() => onNavigate('open-programs')}
            className="w-full flex items-center justify-center gap-2 bg-white text-emerald-700 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-all"
          >
            View Programs & Apply
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
