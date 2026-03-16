import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Trophy, TrendingUp, Award, Heart, Star,
  Loader2, Share2
} from 'lucide-react';
import { AppreciationCard } from './AppreciationCard';

interface AppreciationRow {
  id: string;
  title: string;
  message: string;
  badge_type: string;
  period_label: string;
  created_at: string;
  sender_id: string;
  program_id: string;
  read: boolean;
}

interface FullAppreciation {
  id: string;
  title: string;
  message: string;
  badge_type: string;
  period_label: string;
  created_at: string;
  sender_name: string;
  program_name: string;
}

const badgeIcons: Record<string, { icon: typeof Trophy; color: string; bg: string }> = {
  top_performer: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
  most_improved: { icon: TrendingUp, color: 'text-sky-500', bg: 'bg-sky-50' },
  consistent: { icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  special: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
};

export function MyAppreciations() {
  const { user, profile } = useAuth();
  const [appreciations, setAppreciations] = useState<FullAppreciation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppreciation, setSelectedAppreciation] = useState<FullAppreciation | null>(null);

  useEffect(() => {
    if (user) loadAppreciations();
  }, [user]);

  const loadAppreciations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('appreciations')
      .select('id, title, message, badge_type, period_label, created_at, sender_id, program_id, read')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!data || data.length === 0) {
      setAppreciations([]);
      setLoading(false);
      return;
    }

    const senderIds = [...new Set((data as AppreciationRow[]).map(a => a.sender_id))];
    const programIds = [...new Set((data as AppreciationRow[]).map(a => a.program_id))];

    const [sendersRes, programsRes] = await Promise.all([
      supabase.from('user_profiles').select('id, display_name').in('id', senderIds),
      supabase.from('programs').select('id, name').in('id', programIds),
    ]);

    const senderMap = new Map((sendersRes.data || []).map(s => [s.id, s.display_name || 'Organization']));
    const programMap = new Map((programsRes.data || []).map(p => [p.id, p.name]));

    const items: FullAppreciation[] = (data as AppreciationRow[]).map(a => ({
      id: a.id,
      title: a.title,
      message: a.message,
      badge_type: a.badge_type,
      period_label: a.period_label,
      created_at: a.created_at,
      sender_name: senderMap.get(a.sender_id) || 'Organization',
      program_name: programMap.get(a.program_id) || 'Program',
    }));

    setAppreciations(items);
    setLoading(false);

    const unread = (data as AppreciationRow[]).filter(a => !a.read).map(a => a.id);
    if (unread.length > 0) {
      await supabase
        .from('appreciations')
        .update({ read: true })
        .in('id', unread);
    }
  };

  const handleOpen = (a: FullAppreciation) => {
    setSelectedAppreciation(a);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (appreciations.length === 0) return null;

  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-amber-500" fill="currentColor" />
          <h2 className="text-lg font-bold text-gray-900">My Appreciations</h2>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
            {appreciations.length}
          </span>
        </div>
        <div className="space-y-3">
          {appreciations.map((a) => {
            const badge = badgeIcons[a.badge_type] || badgeIcons.special;
            const Icon = badge.icon;
            const timeAgo = getTimeAgo(a.created_at);

            return (
              <button
                key={a.id}
                onClick={() => handleOpen(a)}
                className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-amber-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 ${badge.bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${badge.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{a.title}</h3>
                      <Share2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0 ml-2" />
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">{a.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>From {a.sender_name}</span>
                      <span>{a.program_name}</span>
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedAppreciation && (
        <AppreciationCard
          appreciation={selectedAppreciation}
          recipientName={profile?.display_name || 'Farmer'}
          recipientAvatar={profile?.avatar_url || null}
          onClose={() => setSelectedAppreciation(null)}
        />
      )}
    </>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
