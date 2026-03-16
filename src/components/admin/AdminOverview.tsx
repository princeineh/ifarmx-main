import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users, FolderOpen, Package, Sprout, ClipboardList,
  TrendingUp, DollarSign, Activity
} from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  individuals: number;
  organizations: number;
  families: number;
  totalPrograms: number;
  publishedPrograms: number;
  totalPlants: number;
  totalCareLogs: number;
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  totalKitCodes: number;
  activatedKits: number;
  pendingApplications: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSignups, setRecentSignups] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [
      usersRes, individualsRes, orgsRes, familiesRes,
      programsRes, publishedRes,
      plantsRes, careLogsRes,
      ordersRes, paidOrdersRes,
      kitCodesRes, activatedRes,
      appsRes, revenueRes, signupsRes
    ] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('user_type', 'individual'),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('user_type', 'organization'),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('user_type', 'family'),
      supabase.from('programs').select('id', { count: 'exact', head: true }),
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('plants').select('id', { count: 'exact', head: true }),
      supabase.from('care_logs').select('id', { count: 'exact', head: true }),
      supabase.from('kit_orders').select('id', { count: 'exact', head: true }),
      supabase.from('kit_orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'paid'),
      supabase.from('kit_codes').select('id', { count: 'exact', head: true }),
      supabase.from('kit_codes').select('id', { count: 'exact', head: true }).eq('used', true),
      supabase.from('program_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('kit_orders').select('total_price').eq('payment_status', 'paid'),
      supabase.from('user_profiles').select('id, display_name, user_type, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const revenue = (revenueRes.data || []).reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);

    setStats({
      totalUsers: usersRes.count || 0,
      individuals: individualsRes.count || 0,
      organizations: orgsRes.count || 0,
      families: familiesRes.count || 0,
      totalPrograms: programsRes.count || 0,
      publishedPrograms: publishedRes.count || 0,
      totalPlants: plantsRes.count || 0,
      totalCareLogs: careLogsRes.count || 0,
      totalOrders: ordersRes.count || 0,
      paidOrders: paidOrdersRes.count || 0,
      totalRevenue: revenue,
      totalKitCodes: kitCodesRes.count || 0,
      activatedKits: activatedRes.count || 0,
      pendingApplications: appsRes.count || 0,
    });

    setRecentSignups(signupsRes.data || []);
    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-blue-700', sub: `${stats.individuals} ind / ${stats.organizations} org / ${stats.families} fam` },
    { label: 'Programs', value: stats.totalPrograms, icon: FolderOpen, color: 'from-emerald-500 to-emerald-700', sub: `${stats.publishedPrograms} published` },
    { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'from-amber-500 to-amber-700', sub: `${stats.paidOrders} paid` },
    { label: 'Revenue', value: `N${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-green-500 to-green-700', sub: `${stats.paidOrders} transactions` },
    { label: 'Active Plants', value: stats.totalPlants, icon: Sprout, color: 'from-teal-500 to-teal-700', sub: `${stats.totalCareLogs} care logs` },
    { label: 'Kit Codes', value: stats.totalKitCodes, icon: ClipboardList, color: 'from-cyan-500 to-cyan-700', sub: `${stats.activatedKits} activated` },
    { label: 'Pending Apps', value: stats.pendingApplications, icon: Activity, color: 'from-rose-500 to-rose-700', sub: 'awaiting review' },
    { label: 'Activation Rate', value: stats.totalKitCodes > 0 ? `${Math.round((stats.activatedKits / stats.totalKitCodes) * 100)}%` : '0%', icon: TrendingUp, color: 'from-gray-600 to-gray-800', sub: `${stats.activatedKits}/${stats.totalKitCodes} kits` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Signups</h3>
        {recentSignups.length === 0 ? (
          <p className="text-sm text-gray-500">No users yet.</p>
        ) : (
          <div className="space-y-3">
            {recentSignups.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                    {(u.display_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{u.display_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{u.user_type}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
