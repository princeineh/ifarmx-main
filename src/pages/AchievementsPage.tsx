import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Trophy, TrendingUp, Award, Heart, Star,
  Loader2, Share2, Filter, ChevronDown
} from 'lucide-react';
import { AppreciationCard } from '../components/dashboard/AppreciationCard';

interface AchievementsPageProps {
  onNavigate: (page: string) => void;
}

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

type BadgeFilter = 'all' | 'top_performer' | 'most_improved' | 'consistent' | 'special';

const badgeIcons: Record<string, { icon: typeof Trophy; color: string; bg: string; border: string; label: string }> = {
  top_performer: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Top Performer' },
  most_improved: { icon: TrendingUp, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-200', label: 'Most Improved' },
  consistent: { icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Consistent Effort' },
  special: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Special Recognition' },
};

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
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function AchievementsPage({ onNavigate }: AchievementsPageProps) {
  const { user, profile } = useAuth();
  const [appreciations, setAppreciations] = useState<FullAppreciation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppreciation, setSelectedAppreciation] = useState<FullAppreciation | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>('all');

  useEffect(() => {
    if (user) loadAppreciations();
  }, [user]);

  const loadAppreciations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('appreciations')
      .select('id, title, message, badge_type, period_label, created_at, sender_id, program_id, read')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

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

  const filtered = badgeFilter === 'all'
    ? appreciations
    : appreciations.filter(a => a.badge_type === badgeFilter);

  const badgeCounts: Record<string, number> = {};
  appreciations.forEach(a => {
    badgeCounts[a.badge_type] = (badgeCounts[a.badge_type] || 0) + 1;
  });

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-2xl p-6 md:p-8 shadow-xl mb-6">
          <div className="absolute top-3 right-6 opacity-10">
            <Star className="w-20 h-20 text-white" fill="currentColor" />
          </div>
          <div className="absolute bottom-2 left-4 opacity-10">
            <Star className="w-14 h-14 text-white" fill="currentColor" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Achievements</h1>
              <p className="text-amber-100 text-sm mt-0.5">
                {appreciations.length === 0
                  ? 'Your awards and recognitions will appear here.'
                  : `You have earned ${appreciations.length} appreciation${appreciations.length !== 1 ? 's' : ''} so far!`}
              </p>
            </div>
          </div>

          {appreciations.length > 0 && (
            <div className="relative flex items-center gap-3 mt-5 flex-wrap">
              {Object.entries(badgeIcons).map(([key, config]) => {
                const count = badgeCounts[key] || 0;
                if (count === 0) return null;
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <Icon className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {appreciations.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setBadgeFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                badgeFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              All ({appreciations.length})
            </button>
            {Object.entries(badgeIcons).map(([key, config]) => {
              const count = badgeCounts[key] || 0;
              if (count === 0) return null;
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setBadgeFilter(key as BadgeFilter)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                    badgeFilter === key
                      ? `${config.bg} ${config.color} border ${config.border}`
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading your achievements...</p>
            </div>
          </div>
        ) : filtered.length === 0 && appreciations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-amber-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">No Achievements Yet</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Keep caring for your plants and participating in programs. Your organizers will recognize your efforts with appreciations!
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-500">No achievements in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const badge = badgeIcons[a.badge_type] || badgeIcons.special;
              const Icon = badge.icon;
              const timeAgo = getTimeAgo(a.created_at);

              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedAppreciation(a)}
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
        )}
      </div>

      {selectedAppreciation && (
        <AppreciationCard
          appreciation={selectedAppreciation}
          recipientName={profile?.display_name || 'Farmer'}
          recipientAvatar={profile?.avatar_url || null}
          onClose={() => setSelectedAppreciation(null)}
        />
      )}
    </div>
  );
}
