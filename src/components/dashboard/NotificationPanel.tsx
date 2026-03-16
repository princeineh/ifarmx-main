import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell, X, Trophy, TrendingUp, Award, Heart,
  Info, Calendar, CheckCheck, Loader2, Share2
} from 'lucide-react';
import { AppreciationCard } from './AppreciationCard';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface AppreciationItem {
  id: string;
  title: string;
  message: string;
  badge_type: string;
  period_label: string;
  read: boolean;
  created_at: string;
  sender_name: string;
  program_name: string;
}

const badgeIcons: Record<string, { icon: typeof Trophy; color: string; bg: string }> = {
  top_performer: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
  most_improved: { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  consistent: { icon: Award, color: 'text-green-500', bg: 'bg-green-50' },
  special: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
};

export function NotificationPanel() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [appreciations, setAppreciations] = useState<AppreciationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'appreciations'>('all');
  const [viewingAppreciation, setViewingAppreciation] = useState<AppreciationItem | null>(null);

  useEffect(() => {
    if (user) loadUnreadCount();
  }, [user]);

  useEffect(() => {
    if (open && user) loadAll();
  }, [open, user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    const [notifRes, appreciationRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false),
      supabase
        .from('appreciations')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false),
    ]);
    setUnreadCount((notifRes.count || 0) + (appreciationRes.count || 0));
  };

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);

    const [notifRes, appreciationRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('appreciations')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (notifRes.data) setNotifications(notifRes.data);

    if (appreciationRes.data && appreciationRes.data.length > 0) {
      const senderIds = [...new Set(appreciationRes.data.map((a: any) => a.sender_id))];
      const programIds = [...new Set(appreciationRes.data.map((a: any) => a.program_id))];

      const [sendersRes, programsRes] = await Promise.all([
        supabase.from('user_profiles').select('id, display_name').in('id', senderIds),
        supabase.from('programs').select('id, name').in('id', programIds),
      ]);

      const senderMap = new Map((sendersRes.data || []).map((s: any) => [s.id, s.display_name || 'Organization']));
      const programMap = new Map((programsRes.data || []).map((p: any) => [p.id, p.name]));

      const items: AppreciationItem[] = appreciationRes.data.map((a: any) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        badge_type: a.badge_type,
        period_label: a.period_label,
        read: a.read,
        created_at: a.created_at,
        sender_name: senderMap.get(a.sender_id) || 'Organization',
        program_name: programMap.get(a.program_id) || 'Program',
      }));
      setAppreciations(items);
    }

    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await Promise.all([
      supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false),
      supabase
        .from('appreciations')
        .update({ read: true })
        .eq('recipient_id', user.id)
        .eq('read', false),
    ]);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setAppreciations(prev => prev.map(a => ({ ...a, read: true })));
    setUnreadCount(0);
  };

  const timeAgo = (dateStr: string): string => {
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
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-white/80" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${
                  activeTab === 'all' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('appreciations')}
                className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${
                  activeTab === 'appreciations' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Appreciations
                {appreciations.filter(a => !a.read).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px]">
                    {appreciations.filter(a => !a.read).length}
                  </span>
                )}
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              ) : activeTab === 'all' ? (
                notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 ${n.read ? '' : 'bg-emerald-50/30'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            n.type === 'appreciation' ? 'bg-amber-50' : 'bg-gray-50'
                          }`}>
                            {n.type === 'appreciation' ? (
                              <Trophy className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Info className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                              {!n.read && <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                appreciations.length === 0 ? (
                  <div className="py-10 text-center">
                    <Trophy className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No appreciations yet</p>
                    <p className="text-xs text-gray-300 mt-1">Keep farming and you may receive one!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {appreciations.map((a) => {
                      const badge = badgeIcons[a.badge_type] || badgeIcons.special;
                      const Icon = badge.icon;
                      return (
                        <button
                          key={a.id}
                          onClick={() => { setViewingAppreciation(a); setOpen(false); }}
                          className={`w-full text-left px-4 py-3 hover:bg-amber-50/50 transition-colors ${a.read ? '' : 'bg-amber-50/30'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl ${badge.bg} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-5 h-5 ${badge.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-sm font-bold text-gray-900">{a.title}</p>
                                <Share2 className="w-3 h-3 text-gray-300 flex-shrink-0 ml-2" />
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">{a.message}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-gray-400">From {a.sender_name}</span>
                                <span className="text-[10px] text-gray-300">|</span>
                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {a.period_label}
                                </span>
                                <span className="text-[10px] text-gray-300">|</span>
                                <span className="text-[10px] text-gray-400">{timeAgo(a.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
      {viewingAppreciation && (
        <AppreciationCard
          appreciation={viewingAppreciation}
          recipientName={profile?.display_name || 'Farmer'}
          recipientAvatar={profile?.avatar_url || null}
          onClose={() => setViewingAppreciation(null)}
        />
      )}
    </div>
  );
}
