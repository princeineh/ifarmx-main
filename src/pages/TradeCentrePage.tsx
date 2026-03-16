import { useState, useEffect } from 'react';
import {
  ArrowLeft, ShoppingBag, Store, MapPin, Lock, Fish,
  Egg, Wheat, Sprout, ChevronRight, Package, Truck, ShoppingCart,
  BarChart3, Users, CheckCircle, Clock, AlertCircle, TrendingUp, Layers,
  Globe, Calendar, Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { KitOrder, Program } from '../types/database';
import { ProgramApplicationModal } from '../components/program/ProgramApplicationModal';

interface TradeCentrePageProps {
  onNavigate: (page: string, data?: any) => void;
}

const comingSoonProducts = [
  { name: 'Fishery', icon: Fish, description: 'Fresh fish from Nigerian waters', color: 'from-blue-400 to-blue-600' },
  { name: 'Poultry', icon: Egg, description: 'Chicken, eggs & more', color: 'from-amber-400 to-amber-600' },
  { name: 'Cash Crops', icon: Wheat, description: 'Cocoa, cashew, rubber', color: 'from-emerald-400 to-emerald-600' },
  { name: 'Seedlings', icon: Sprout, description: 'Premium nursery stock', color: 'from-green-400 to-teal-600' },
];

export function TradeCentrePage({ onNavigate }: TradeCentrePageProps) {
  const { user, profile } = useAuth();
  const isOrg = profile?.user_type === 'organization';

  if (isOrg) {
    return <OrgTradeCentre onNavigate={onNavigate} />;
  }

  return <FarmerTradeCentre onNavigate={onNavigate} />;
}

interface ProgramKitSummary {
  program: Program;
  totalParticipants: number;
  kitsAssigned: number;
  kitsActivated: number;
  codesAvailable: number;
}

function OrgTradeCentre({ onNavigate }: { onNavigate: (page: string, data?: any) => void }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<KitOrder[]>([]);
  const [programSummaries, setProgramSummaries] = useState<ProgramKitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalKitsPurchased, setTotalKitsPurchased] = useState(0);
  const [totalKitsDistributed, setTotalKitsDistributed] = useState(0);
  const [pendingDeliveries, setPendingDeliveries] = useState(0);

  useEffect(() => {
    if (user) loadOrgData();
  }, [user]);

  const loadOrgData = async () => {
    if (!user) return;

    const [ordersRes, programsRes] = await Promise.all([
      supabase
        .from('kit_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('programs')
        .select('*')
        .eq('org_user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    const allOrders = ordersRes.data || [];
    setOrders(allOrders);

    let purchased = 0;
    let delivered = 0;
    let pending = 0;

    for (const order of allOrders) {
      if (order.payment_status === 'paid') {
        purchased += order.quantity;
        if (order.delivery_status === 'delivered') {
          delivered += order.quantity;
        } else {
          pending += order.quantity;
        }
      }
    }

    setTotalKitsPurchased(purchased);
    setPendingDeliveries(pending);

    const programs = programsRes.data || [];
    const summaries: ProgramKitSummary[] = [];
    let distributed = 0;

    for (const program of programs) {
      const [participantsRes, assignedRes, activatedRes, codesRes] = await Promise.all([
        supabase.from('program_participants').select('id', { count: 'exact', head: true }).eq('program_id', program.id),
        supabase.from('program_participants').select('id', { count: 'exact', head: true }).eq('program_id', program.id).eq('kit_code_assigned', true),
        supabase.from('program_participants').select('id', { count: 'exact', head: true }).eq('program_id', program.id).eq('kit_activated', true),
        supabase.from('kit_codes').select('id', { count: 'exact', head: true }).eq('program_id', program.id).eq('used', false),
      ]);

      const assigned = assignedRes.count || 0;
      distributed += assigned;

      summaries.push({
        program,
        totalParticipants: participantsRes.count || 0,
        kitsAssigned: assigned,
        kitsActivated: activatedRes.count || 0,
        codesAvailable: codesRes.count || 0,
      });
    }

    setTotalKitsDistributed(distributed);
    setProgramSummaries(summaries);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDeliveryColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mud-texture adinkra-bg flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b-4 kente-border">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-full flex items-center justify-center shadow-md">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Trade Centre</h1>
                <p className="text-xs text-gray-500">Procure for your programs & monitor distribution</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalKitsPurchased}</p>
            <p className="text-xs text-gray-500 mt-1">Kits Purchased</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalKitsDistributed}</p>
            <p className="text-xs text-gray-500 mt-1">Kits Distributed</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-3">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingDeliveries}</p>
            <p className="text-xs text-gray-500 mt-1">In Transit</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalKitsPurchased > 0 ? Math.round((totalKitsDistributed / totalKitsPurchased) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Distribution Rate</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Purchase Kits for Programs</h2>
                <p className="text-sm text-gray-500 mt-0.5">Buy starter kits in bulk to distribute to your program participants</p>
              </div>
              <button
                onClick={() => onNavigate('kit-purchase')}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:from-emerald-600 hover:to-emerald-700 inline-flex items-center gap-2 transition-all shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Purchase Kits
              </button>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              Kit Distribution by Program
            </h3>

            {programSummaries.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Layers className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No programs yet. Create a program first, then purchase kits.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {programSummaries.map(({ program, totalParticipants, kitsAssigned, kitsActivated, codesAvailable }) => {
                  const needsKits = totalParticipants - kitsAssigned;
                  const activationRate = kitsAssigned > 0 ? Math.round((kitsActivated / kitsAssigned) * 100) : 0;

                  return (
                    <div
                      key={program.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{program.name}</h4>
                          <p className="text-xs text-gray-500">{totalParticipants} participants</p>
                        </div>
                        {needsKits > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            {needsKits} need kits
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <p className="text-lg font-bold text-gray-900">{kitsAssigned}</p>
                          <p className="text-[10px] text-gray-500">Assigned</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <p className="text-lg font-bold text-emerald-600">{kitsActivated}</p>
                          <p className="text-[10px] text-gray-500">Activated</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <p className="text-lg font-bold text-blue-600">{codesAvailable}</p>
                          <p className="text-[10px] text-gray-500">Codes Left</p>
                        </div>
                      </div>

                      {kitsAssigned > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Activation Rate</span>
                            <span className={`font-semibold ${activationRate >= 75 ? 'text-emerald-600' : activationRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                              {activationRate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${activationRate >= 75 ? 'bg-emerald-500' : activationRate >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                              style={{ width: `${activationRate}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Land Leasing for Participants</h2>
                  <p className="text-sm text-gray-500">
                    Lease farmland across Nigeria for your program participants. Connect with verified landowners to secure agricultural plots for palm oil cultivation at scale.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 text-white rounded-full text-xs font-semibold flex-shrink-0 ml-4">
                  <Clock className="w-3 h-3" />
                  Coming Soon
                </span>
              </div>
              <div className="mt-4 grid sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-dashed border-gray-300">
                  <p className="font-semibold text-gray-700 text-sm">Plot Matching</p>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically match participants with available plots in their region</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-dashed border-gray-300">
                  <p className="font-semibold text-gray-700 text-sm">Bulk Leasing</p>
                  <p className="text-xs text-gray-500 mt-0.5">Negotiate group rates for large-scale program deployments</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-dashed border-gray-300">
                  <p className="font-semibold text-gray-700 text-sm">Lease Tracking</p>
                  <p className="text-xs text-gray-500 mt-0.5">Monitor lease terms, payments, and renewals for all participants</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">More Products Coming</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 text-white rounded-full text-xs font-semibold">
              <Lock className="w-3 h-3" />
              Locked
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {comingSoonProducts.map((product) => (
              <div
                key={product.name}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 opacity-60 relative"
              >
                <div className="absolute top-2 right-2">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${product.color} rounded-lg flex items-center justify-center mb-3 grayscale`}>
                  <product.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-600 text-sm mb-1">{product.name}</h3>
                <p className="text-xs text-gray-400">{product.description}</p>
              </div>
            ))}
          </div>
        </div>

        {orders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Order History</h2>
              <button
                onClick={() => onNavigate('order-tracking')}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <button
                  key={order.id}
                  onClick={() => onNavigate('order-tracking', order)}
                  className="w-full bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{order.order_number}</p>
                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDeliveryColor(order.delivery_status)}`}>
                        <span className="inline-flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {order.delivery_status.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm pl-12">
                    <span className="text-gray-600">{order.quantity}x iFarm Kit</span>
                    <span className="font-semibold text-gray-900">N{order.total_price.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
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
}

function FarmerTradeCentre({ onNavigate }: { onNavigate: (page: string, data?: any) => void }) {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<KitOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [programs, setPrograms] = useState<PublicProgram[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [applyingTo, setApplyingTo] = useState<PublicProgram | null>(null);

  useEffect(() => {
    if (user) {
      loadRecentOrders();
      loadPrograms();
    }
  }, [user]);

  const loadPrograms = async () => {
    if (!user) return;
    setLoadingPrograms(true);

    const { data: publishedPrograms } = await supabase
      .from('programs')
      .select('id, name, description, target_participants, start_date, org_user_id')
      .eq('status', 'published')
      .eq('acceptance_type', 'open')
      .order('created_at', { ascending: false });

    if (!publishedPrograms || publishedPrograms.length === 0) {
      setPrograms([]);
      setLoadingPrograms(false);
      return;
    }

    const orgIds = [...new Set(publishedPrograms.map(p => p.org_user_id))];
    const { data: orgProfiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', orgIds);

    const orgMap = new Map((orgProfiles || []).map(p => [p.id, p.display_name]));

    const { data: myApps } = await supabase
      .from('program_applications')
      .select('program_id, status')
      .eq('user_id', user.id);

    const appMap = new Map((myApps || []).map(a => [a.program_id, a.status]));

    const result: PublicProgram[] = [];

    for (const prog of publishedPrograms) {
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
        description: prog.description,
        target_participants: prog.target_participants,
        start_date: prog.start_date,
        org_name: orgMap.get(prog.org_user_id) || 'Organization',
        participant_count: pCount,
        user_applied: appMap.has(prog.id),
        application_status: appMap.get(prog.id) || null,
      });
    }

    setPrograms(result);
    setLoadingPrograms(false);
  };

  const loadRecentOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('kit_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    if (data) setRecentOrders(data);
    setLoadingOrders(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDeliveryColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b-4 kente-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Trade Centre</h1>
                <p className="text-sm text-gray-600">Buy, sell & grow your agribusiness</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <button
            onClick={() => onNavigate('kit-purchase')}
            className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 text-left border-2 border-transparent hover:border-emerald-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold text-gray-900">Buy a Kit</h2>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Purchase your palm oil starter kit and get a unique activation code
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">N24,999</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Free Delivery</span>
                </div>
              </div>
            </div>
          </button>

          <div className="relative bg-white rounded-2xl shadow-md p-6 text-left border-2 border-dashed border-gray-300 opacity-75">
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
              <Lock className="w-3 h-3" />
              Opens in 5 Months
            </div>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-600 mb-1">Marketplace</h2>
                <p className="text-sm text-gray-500 mb-3">
                  Sell your palm oil products or buy from other farmers across Nigeria.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Palm Oil</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Palm Kernel</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ongoing Programs</h2>
              <p className="text-xs text-gray-500">Join an open program and start your farming journey</p>
            </div>
          </div>

          {loadingPrograms ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : programs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No open programs available right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((prog) => {
                const spots = prog.target_participants - prog.participant_count;
                const fillPct = Math.round((prog.participant_count / prog.target_participants) * 100);

                return (
                  <div
                    key={prog.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all"
                  >
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-5 py-4">
                      <h3 className="font-bold text-white text-sm truncate">{prog.name}</h3>
                      <p className="text-emerald-200 text-xs mt-0.5">by {prog.org_name}</p>
                    </div>
                    <div className="p-5 space-y-3">
                      {prog.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{prog.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>{spots} spot{spots !== 1 ? 's' : ''} left</span>
                        </div>
                        {prog.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{new Date(prog.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                          <span>{prog.participant_count} / {prog.target_participants} participants</span>
                          <span>{fillPct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>
                      {prog.user_applied ? (
                        <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold ${
                          prog.application_status === 'approved'
                            ? 'bg-green-50 text-green-700'
                            : prog.application_status === 'rejected'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {prog.application_status === 'approved' ? (
                            <><CheckCircle className="w-4 h-4" /> Approved</>
                          ) : prog.application_status === 'rejected' ? (
                            <><AlertCircle className="w-4 h-4" /> Not Approved</>
                          ) : (
                            <><Clock className="w-4 h-4" /> Application Pending</>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setApplyingTo(prog)}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          Apply to Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-10">
          <div className="relative bg-white rounded-2xl shadow-md p-6 border-2 border-dashed border-gray-300 opacity-75">
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
              <Lock className="w-3 h-3" />
              Coming Soon
            </div>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-600 mb-1">Land Leasing</h2>
                <p className="text-sm text-gray-500">
                  Lease farmland across Nigeria or make your land available for palm oil farming.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Lease Land</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Rent Farmland</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Land Matching</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">More Products Coming</h2>
            <div className="flex items-center gap-1 bg-gray-800 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              <Lock className="w-3 h-3" />
              Locked
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {comingSoonProducts.map((product) => (
              <div
                key={product.name}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 opacity-60 relative"
              >
                <div className="absolute top-2 right-2">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${product.color} rounded-lg flex items-center justify-center mb-3 grayscale`}>
                  <product.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-600 text-sm mb-1">{product.name}</h3>
                <p className="text-xs text-gray-400">{product.description}</p>
              </div>
            ))}
          </div>
        </div>

        {recentOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <button
                onClick={() => onNavigate('order-tracking')}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => onNavigate('order-tracking', order)}
                  className="w-full bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{order.order_number}</p>
                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDeliveryColor(order.delivery_status)}`}>
                        <span className="inline-flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {order.delivery_status.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{order.quantity}x iFarm Kit</span>
                    <span className="font-semibold text-gray-900">N{order.total_price.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {recentOrders.length === 0 && !loadingOrders && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No orders yet. Purchase a kit to get started!</p>
          </div>
        )}
      </main>

      {applyingTo && (
        <ProgramApplicationModal
          program={applyingTo}
          onClose={() => setApplyingTo(null)}
          onApplied={() => loadPrograms()}
        />
      )}
    </div>
  );
}
