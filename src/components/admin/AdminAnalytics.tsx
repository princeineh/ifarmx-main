import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Eye, Users, MousePointerClick, Clock, TrendingUp,
  ArrowUpRight, ArrowDownRight, BarChart3, Globe, Navigation
} from 'lucide-react';

interface DailyMetric {
  date: string;
  count: number;
}

interface HourlyMetric {
  hour: number;
  count: number;
}

interface PageMetric {
  page: string;
  views: number;
  unique_users: number;
}

interface EventMetric {
  event_type: string;
  count: number;
}

interface ReferrerMetric {
  referrer: string;
  count: number;
  pct: number;
}

interface UserActivityRow {
  user_id: string;
  display_name: string;
  user_type: string;
  page_views: number;
  events: number;
  last_active: string;
}

type TimeRange = 'today' | '7d' | '30d' | '90d';

const RANGE_LABELS: Record<TimeRange, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
};

const RANGE_DAYS: Record<TimeRange, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90 };

const pageLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  'open-programs': 'Open Programs',
  'trade-centre': 'Trade Centre',
  agronomist: 'AI Agronomist',
  'kit-purchase': 'Kit Purchase',
  activate: 'Activate Kit',
  profile: 'Profile',
  organization: 'Organization',
  admin: 'Admin Panel',
  plant: 'Plant Detail',
  achievements: 'Achievements',
  marketplace: 'Marketplace',
  'order-tracking': 'Order Tracking',
  'participant-monitor': 'Participant Monitor',
  'program-detail': 'Program Detail',
  login: 'Login',
  signup: 'Sign Up',
  reserve: 'Reservation',
  landing: 'Landing Page',
  'forgot-password': 'Forgot Password',
};

export function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>('today');

  const [totalPageViews, setTotalPageViews] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [uniqueSessions, setUniqueSessions] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [dailyViews, setDailyViews] = useState<DailyMetric[]>([]);
  const [topPages, setTopPages] = useState<PageMetric[]>([]);
  const [topEvents, setTopEvents] = useState<EventMetric[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityRow[]>([]);
  const [prevPeriodViews, setPrevPeriodViews] = useState(0);
  const [prevPeriodVisitors, setPrevPeriodVisitors] = useState(0);
  const [hourlyDistribution, setHourlyDistribution] = useState<number[]>(new Array(24).fill(0));
  const [todayHourly, setTodayHourly] = useState<HourlyMetric[]>([]);
  const [trafficSources, setTrafficSources] = useState<ReferrerMetric[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  const getSinceStr = () => {
    if (range === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.toISOString();
    }
    const since = new Date();
    since.setDate(since.getDate() - RANGE_DAYS[range]);
    return since.toISOString();
  };

  const loadAnalytics = async () => {
    setLoading(true);
    const sinceStr = getSinceStr();

    let prevSinceStr = '';
    if (range !== 'today') {
      const days = RANGE_DAYS[range];
      const prevSince = new Date();
      prevSince.setDate(prevSince.getDate() - days * 2);
      prevSinceStr = prevSince.toISOString();
    }

    const queries: Promise<unknown>[] = [
      supabase.from('page_views').select('*').gte('created_at', sinceStr).order('created_at', { ascending: true }),
      supabase.from('user_events').select('*').gte('created_at', sinceStr).order('created_at', { ascending: true }),
    ];

    if (prevSinceStr) {
      queries.push(
        supabase.from('page_views').select('user_id, session_id').gte('created_at', prevSinceStr).lt('created_at', sinceStr)
      );
    }

    const results = await Promise.all(queries);
    const viewsRes = results[0] as { data: Record<string, string>[] | null };
    const eventsRes = results[1] as { data: Record<string, string>[] | null };
    const prevViewsRes = results[2] as { data: Record<string, string>[] | null } | undefined;

    const views = viewsRes.data || [];
    const events = eventsRes.data || [];
    const prevViews = prevViewsRes?.data || [];

    setTotalPageViews(views.length);
    setTotalEvents(events.length);
    setPrevPeriodViews(prevViews.length);

    const uniqueUserIds = new Set(views.map(v => v.user_id).filter(Boolean));
    setUniqueVisitors(uniqueUserIds.size);

    const prevUniqueUserIds = new Set(prevViews.map(v => v.user_id).filter(Boolean));
    setPrevPeriodVisitors(prevUniqueUserIds.size);

    const uniqueSessionIds = new Set(views.map(v => v.session_id).filter(Boolean));
    setUniqueSessions(uniqueSessionIds.size);

    if (range === 'today') {
      const hourMap = new Map<number, number>();
      for (let h = 0; h < 24; h++) hourMap.set(h, 0);
      views.forEach(v => {
        const hour = new Date(v.created_at).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      });
      setTodayHourly(Array.from(hourMap.entries()).map(([hour, count]) => ({ hour, count })));
      setDailyViews([]);
    } else {
      const days = RANGE_DAYS[range];
      const dailyMap = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const key = d.toISOString().split('T')[0];
        dailyMap.set(key, 0);
      }
      views.forEach(v => {
        const key = v.created_at.split('T')[0];
        dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
      });
      setDailyViews(Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count })));
      setTodayHourly([]);
    }

    const pageMap = new Map<string, { views: number; users: Set<string> }>();
    views.forEach(v => {
      const entry = pageMap.get(v.page) || { views: 0, users: new Set<string>() };
      entry.views++;
      if (v.user_id) entry.users.add(v.user_id);
      pageMap.set(v.page, entry);
    });
    const pageMetrics: PageMetric[] = Array.from(pageMap.entries())
      .map(([page, data]) => ({ page, views: data.views, unique_users: data.users.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
    setTopPages(pageMetrics);

    const eventMap = new Map<string, number>();
    events.forEach(e => {
      eventMap.set(e.event_type, (eventMap.get(e.event_type) || 0) + 1);
    });
    const eventMetrics: EventMetric[] = Array.from(eventMap.entries())
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setTopEvents(eventMetrics);

    const hourly = new Array(24).fill(0);
    views.forEach(v => {
      const hour = new Date(v.created_at).getHours();
      hourly[hour]++;
    });
    setHourlyDistribution(hourly);

    const refMap = new Map<string, number>();
    views.forEach(v => {
      if (!v.referrer) return;
      refMap.set(v.referrer, (refMap.get(v.referrer) || 0) + 1);
    });
    const totalWithRef = Array.from(refMap.values()).reduce((a, b) => a + b, 0);
    const refMetrics: ReferrerMetric[] = Array.from(refMap.entries())
      .map(([referrer, count]) => ({
        referrer,
        count,
        pct: totalWithRef > 0 ? Math.round((count / totalWithRef) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setTrafficSources(refMetrics);

    const userMap = new Map<string, { views: number; events: number; lastActive: string }>();
    views.forEach(v => {
      if (!v.user_id) return;
      const entry = userMap.get(v.user_id) || { views: 0, events: 0, lastActive: v.created_at };
      entry.views++;
      if (v.created_at > entry.lastActive) entry.lastActive = v.created_at;
      userMap.set(v.user_id, entry);
    });
    events.forEach(e => {
      if (!e.user_id) return;
      const entry = userMap.get(e.user_id) || { views: 0, events: 0, lastActive: e.created_at };
      entry.events++;
      if (e.created_at > entry.lastActive) entry.lastActive = e.created_at;
      userMap.set(e.user_id, entry);
    });

    const topUserIds = Array.from(userMap.entries())
      .sort((a, b) => (b[1].views + b[1].events) - (a[1].views + a[1].events))
      .slice(0, 15)
      .map(([id]) => id);

    let activityRows: UserActivityRow[] = [];
    if (topUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, user_type')
        .in('id', topUserIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      activityRows = topUserIds.map(uid => {
        const data = userMap.get(uid)!;
        const prof = profileMap.get(uid);
        return {
          user_id: uid,
          display_name: prof?.display_name || 'Unknown',
          user_type: prof?.user_type || 'individual',
          page_views: data.views,
          events: data.events,
          last_active: data.lastActive,
        };
      });
    }
    setUserActivity(activityRows);

    setLoading(false);
  };

  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const viewsChange = range !== 'today' ? pctChange(totalPageViews, prevPeriodViews) : undefined;
  const visitorsChange = range !== 'today' ? pctChange(uniqueVisitors, prevPeriodVisitors) : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxDailyView = Math.max(...dailyViews.map(d => d.count), 1);
  const maxHourly = Math.max(...hourlyDistribution, 1);
  const maxTodayHourly = Math.max(...todayHourly.map(h => h.count), 1);

  const now = new Date();
  const currentHour = now.getHours();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Analytics</h2>
          <p className="text-xs text-gray-500">User behavior and site activity insights</p>
        </div>
        <div className="flex items-center bg-gray-800 rounded-lg p-0.5">
          {(['today', '7d', '30d', '90d'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                range === r ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {range === 'today' && (
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-700/40 rounded-2xl px-5 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-300">
            Live — {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="text-xs text-emerald-500 ml-auto">
            Updated just now · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Page Views"
          value={totalPageViews.toLocaleString()}
          icon={Eye}
          color="from-blue-500 to-blue-700"
          change={viewsChange}
          todayBadge={range === 'today'}
        />
        <StatCard
          label="Unique Visitors"
          value={uniqueVisitors.toLocaleString()}
          icon={Users}
          color="from-emerald-500 to-emerald-700"
          change={visitorsChange}
          todayBadge={range === 'today'}
        />
        <StatCard
          label="Sessions"
          value={uniqueSessions.toLocaleString()}
          icon={Globe}
          color="from-cyan-500 to-cyan-700"
          todayBadge={range === 'today'}
        />
        <StatCard
          label="User Events"
          value={totalEvents.toLocaleString()}
          icon={MousePointerClick}
          color="from-amber-500 to-amber-700"
          todayBadge={range === 'today'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              {range === 'today' ? 'Views by Hour (Today)' : 'Daily Page Views'}
            </h3>
            <span className="text-[10px] text-gray-400">
              {range === 'today' ? `${currentHour + 1} hours tracked` : `Last ${RANGE_DAYS[range]} days`}
            </span>
          </div>

          {range === 'today' ? (
            <>
              <div className="flex items-end gap-[2px] h-40">
                {todayHourly.map(({ hour, count }) => {
                  const heightPct = (count / maxTodayHourly) * 100;
                  const isCurrent = hour === currentHour;
                  const isFuture = hour > currentHour;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center justify-end group relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {count} views · {hour.toString().padStart(2, '0')}:00
                      </div>
                      <div
                        className={`w-full rounded-t-sm min-h-[2px] transition-all duration-300 ${
                          isFuture
                            ? 'bg-gray-100'
                            : isCurrent
                            ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 ring-1 ring-emerald-300'
                            : 'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500'
                        }`}
                        style={{ height: isFuture ? '4px' : `${Math.max(heightPct, 2)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[9px] text-gray-400">
                <span>12am</span>
                <span>6am</span>
                <span>12pm</span>
                <span>6pm</span>
                <span>11pm</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-blue-500 to-blue-400" />
                  <span className="text-[9px] text-gray-500">Past hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-emerald-500 to-emerald-400" />
                  <span className="text-[9px] text-gray-500">Current hour</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-gray-100" />
                  <span className="text-[9px] text-gray-500">Not yet</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-end gap-[2px] h-40">
                {dailyViews.map((d) => {
                  const heightPct = (d.count / maxDailyView) * 100;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {d.count} views - {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm min-h-[2px] transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[9px] text-gray-400">
                <span>{dailyViews[0]?.date ? new Date(dailyViews[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
                <span>{dailyViews[dailyViews.length - 1]?.date ? new Date(dailyViews[dailyViews.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Activity by Hour
            </h3>
            <span className="text-[10px] text-gray-400">Peak usage times</span>
          </div>
          <div className="flex items-end gap-[2px] h-40">
            {hourlyDistribution.map((count, hour) => {
              const heightPct = (count / maxHourly) * 100;
              const isPeak = count === maxHourly && count > 0;
              return (
                <div key={hour} className="flex-1 flex flex-col items-center justify-end group relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {count} views at {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div
                    className={`w-full rounded-t-sm min-h-[2px] transition-all duration-300 ${
                      isPeak
                        ? 'bg-gradient-to-t from-amber-500 to-amber-400'
                        : 'bg-gradient-to-t from-amber-400/60 to-amber-300/60 hover:from-amber-500 hover:to-amber-400'
                    }`}
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-gray-400">
            <span>12am</span>
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>11pm</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-rose-500" />
            Traffic Sources
            <span className="ml-auto text-[10px] font-normal text-gray-400">Where users came from</span>
          </h3>
          {trafficSources.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No referrer data for this period</p>
          ) : (
            <div className="space-y-2.5">
              {trafficSources.map((ref, i) => {
                const widthPct = (ref.count / (trafficSources[0]?.count || 1)) * 100;
                const sourceLabel = pageLabels[ref.referrer] || ref.referrer;
                const isExternal = ref.referrer.startsWith('http');
                return (
                  <div key={ref.referrer} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono w-4">{i + 1}.</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold ${
                          isExternal ? 'bg-blue-100 text-blue-600' : 'bg-rose-50 text-rose-500'
                        }`}>
                          {isExternal ? <Globe className="w-3 h-3" /> : sourceLabel[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-gray-800">{sourceLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-gray-500">{ref.count} visits</span>
                        <span className="font-bold text-rose-500">{ref.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Most Visited Pages
          </h3>
          {topPages.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No page view data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topPages.map((p, i) => {
                const widthPct = (p.views / (topPages[0]?.views || 1)) * 100;
                return (
                  <div key={p.page} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono w-4">{i + 1}.</span>
                        <span className="text-xs font-semibold text-gray-800">{pageLabels[p.page] || p.page}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        <span>{p.views} views</span>
                        <span>{p.unique_users} users</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-blue-500" />
            User Events Breakdown
          </h3>
          {topEvents.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No event data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topEvents.map((e, i) => {
                const widthPct = (e.count / (topEvents[0]?.count || 1)) * 100;
                return (
                  <div key={e.event_type} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono w-4">{i + 1}.</span>
                        <span className="text-xs font-semibold text-gray-800 capitalize">{e.event_type.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{e.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-500" />
            Most Active Users
          </h3>
          {userActivity.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No user activity data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[10px] font-semibold text-gray-500 pb-2 uppercase tracking-wider">User</th>
                    <th className="text-left text-[10px] font-semibold text-gray-500 pb-2 uppercase tracking-wider">Type</th>
                    <th className="text-right text-[10px] font-semibold text-gray-500 pb-2 uppercase tracking-wider">Pages</th>
                    <th className="text-right text-[10px] font-semibold text-gray-500 pb-2 uppercase tracking-wider">Events</th>
                    <th className="text-right text-[10px] font-semibold text-gray-500 pb-2 uppercase tracking-wider">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {userActivity.map((u) => (
                    <tr key={u.user_id} className="hover:bg-gray-50/50">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 flex-shrink-0">
                            {(u.display_name || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">{u.display_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          u.user_type === 'organization'
                            ? 'bg-amber-100 text-amber-700'
                            : u.user_type === 'family'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {u.user_type}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-xs font-semibold text-gray-700">{u.page_views}</td>
                      <td className="py-2.5 text-right text-xs font-semibold text-gray-700">{u.events}</td>
                      <td className="py-2.5 text-right text-[10px] text-gray-500">
                        {new Date(u.last_active).toLocaleDateString()} {new Date(u.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, change, todayBadge }: {
  label: string;
  value: string;
  icon: typeof Eye;
  color: string;
  change?: number;
  todayBadge?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
        {todayBadge && change === undefined && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
