import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Leaf, Plus, Menu, X, Users as UsersIcon, Sprout,
  UsersRound, Store, MessageSquare, Sun, Package, Globe, Shield,
  Key, ArrowRight, Trophy, Copy, Check, Timer, Mail, FlaskConical
} from 'lucide-react';
import type { Plant, CareLog, UserType } from '../types/database';
import { DailyReminder } from '../components/dashboard/DailyReminder';
import { SoloFarmStats } from '../components/dashboard/FarmStatsBoard';
import { NotificationPanel } from '../components/dashboard/NotificationPanel';
import { OpenProgramsBanner } from '../components/dashboard/OpenProgramsBanner';
import { FamilyDynastyPanel } from '../components/dashboard/FamilyDynastyPanel';
import { GuidedTour } from '../components/dashboard/GuidedTour';
import { SpotlightTour } from '../components/dashboard/SpotlightTour';
import {
  individualSpotlightSteps, familySpotlightSteps,
  individualPostDemoSteps, familyPostDemoSteps,
} from '../components/dashboard/tourSteps';
import { setupDemo } from '../services/demoSetup';
import type { DemoOffer } from '../components/dashboard/SpotlightTour';

interface DashboardPageProps {
  onNavigate: (page: string, data?: any) => void;
  showTour?: boolean;
}

const timeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const naijaTips = [
  'Every drop of water you give is an act of love — water early morning or late evening.',
  'Check your plants weekly for pests — consistency is the heartbeat of good farming.',
  'Palm trees love sunlight, just like you need light to grow. Give them at least 6 hours daily.',
  'Mulching is like a warm blanket for your soil — it retains moisture and protects roots.',
  'A consistent schedule shows commitment. Your palms reflect the care you give them.',
  'Organic manure feeds the soil for seasons to come — invest in what lasts.',
];

export function DashboardPage({ onNavigate, showTour: showTourProp }: DashboardPageProps) {
  const { user, profile, signOut, isAdmin, refreshProfile } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<CareLog[]>([]);
  const [kitCount, setKitCount] = useState(0);
  const [pendingKitCodes, setPendingKitCodes] = useState<{ code: string; programName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [tourPhase, setTourPhase] = useState<'none' | 'modal' | 'spotlight' | 'demo_guide'>('none');
  const spotlightPathRef = useRef<UserType | null>(null);
  const [reservation, setReservation] = useState<{ kit_count: string; created_at: string; join_as?: string; slots?: number } | null>(null);
  const [testBannerDismissed, setTestBannerDismissed] = useState(() =>
    sessionStorage.getItem('ifarmx_test_banner_dismissed') === '1'
  );
  const isTestRunActive = false;

  const tip = naijaTips[Math.floor(Date.now() / 86400000) % naijaTips.length];

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!profile || profile.tour_completed) return;
    const demoGuideFlag = sessionStorage.getItem('ifarmx_demo_guide');
    if (demoGuideFlag && demoGuideFlag !== 'organization') {
      spotlightPathRef.current = demoGuideFlag as UserType;
      setTourPhase('demo_guide');
      return;
    }
    const spotlightFlag = sessionStorage.getItem('ifarmx_spotlight');
    if (spotlightFlag && spotlightFlag !== 'organization') {
      spotlightPathRef.current = spotlightFlag as UserType;
      setTourPhase('spotlight');
    } else if (showTourProp) {
      setTourPhase('modal');
    }
  }, [showTourProp, profile]);

  const loadData = async () => {
    if (!user) return;

    const [plantsRes, ordersRes, pendingCodeRes, reservationRes] = await Promise.all([
      supabase
        .from('plants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('kit_orders')
        .select('quantity, payment_status')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid'),
      supabase
        .from('kit_codes')
        .select('code, program_id, programs(name)')
        .eq('assigned_to_user_id', user.id)
        .eq('used', false),
      supabase
        .from('reservations')
        .select('kit_count, created_at, join_as, slots')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    if (reservationRes.data && reservationRes.data.length > 0) {
      setReservation(reservationRes.data[0]);
    }

    if (plantsRes.data) {
      setPlants(plantsRes.data);

      if (plantsRes.data.length > 0) {
        const plantIds = plantsRes.data.map(p => p.id);
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diff);
        const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

        const [weeklyRes] = await Promise.all([
          supabase
            .from('care_logs')
            .select('*')
            .in('plant_id', plantIds)
            .gte('log_date', weekStartStr)
            .order('log_date', { ascending: false }),
        ]);

        if (weeklyRes.data) setWeeklyLogs(weeklyRes.data);
      }
    }

    if (ordersRes.data) {
      const total = ordersRes.data.reduce((sum, o) => sum + o.quantity, 0);
      setKitCount(total);
    }

    if (pendingCodeRes.data && pendingCodeRes.data.length > 0) {
      setPendingKitCodes(
        pendingCodeRes.data.map((row: any) => ({
          code: row.code,
          programName: row.programs?.name || 'Program',
        }))
      );
    } else {
      setPendingKitCodes([]);
    }

    setLoading(false);
  };

  const displayName = profile?.display_name || 'Farmer';

  const demoOffer: DemoOffer = {
    title: 'Ready to Try It Out?',
    body: "We'll create a few demo seedlings so you can explore the dashboard with real data -- log care, check health, and see how everything works.",
    buttonLabel: 'Set Up My Demo Farm',
    loadingText: 'Planting your demo seedlings...',
  };

  const handleDemoRequested = async () => {
    if (!user || !spotlightPathRef.current) return;
    await setupDemo(user.id, spotlightPathRef.current);
    await supabase
      .from('user_profiles')
      .update({ tour_completed: true })
      .eq('id', user.id);
    sessionStorage.removeItem('ifarmx_spotlight');
    sessionStorage.setItem('ifarmx_demo_guide', spotlightPathRef.current);
    await loadData();
    await refreshProfile();
    setTourPhase('demo_guide');
  };

  if (loading) {
    return (
      <div className="min-h-screen mud-texture adinkra-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-grove-500 to-warmth-500 rounded-full flex items-center justify-center mx-auto mb-4 stage-pulse">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-700 font-semibold">Preparing your garden...</p>
          <p className="text-gray-400 text-xs mt-1">Good things take time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm border-b-2 border-grove-500/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-grove-500 to-warmth-500 rounded-xl flex items-center justify-center shadow-md">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-african font-bold text-lg text-earth-900 leading-tight block">iFarmX</span>
                <span className="text-[10px] text-warmth-500 font-semibold tracking-wider uppercase">Grow With Love</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 text-grove-700 bg-grove-50 rounded-lg font-semibold text-sm"
              >
                Home
              </button>
              {profile?.user_type === 'organization' && (
                <>
                  <button
                    onClick={() => onNavigate('organization')}
                    className="px-4 py-2 text-gray-600 hover:text-grove-700 hover:bg-grove-50 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Programs
                  </button>
                  <button
                    onClick={() => onNavigate('participant-monitor')}
                    className="px-4 py-2 text-gray-600 hover:text-grove-700 hover:bg-grove-50 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Monitor
                  </button>
                </>
              )}
              <button
                data-tour="nav-trade-centre"
                onClick={() => onNavigate('trade-centre')}
                className="px-4 py-2 text-gray-600 hover:text-grove-700 hover:bg-grove-50 rounded-lg font-semibold text-sm transition-colors"
              >
                Trade Centre
              </button>
              <button
                data-tour="nav-agronomist"
                onClick={() => onNavigate('agronomist')}
                className="px-4 py-2 text-gray-600 hover:text-grove-700 hover:bg-grove-50 rounded-lg font-semibold text-sm transition-colors"
              >
                AI Agronomist
              </button>
              {isAdmin && (
                <button
                  onClick={() => onNavigate('admin')}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-semibold text-sm transition-colors inline-flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <button
                data-tour="nav-profile"
                onClick={() => onNavigate('profile')}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-earth-200 hover:border-grove-400 transition-colors flex-shrink-0"
                title="My Profile"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-grove-400 to-warmth-400 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{(profile?.display_name || 'U')[0].toUpperCase()}</span>
                  </div>
                )}
              </button>
              <button
                onClick={signOut}
                className="px-4 py-2 text-gray-500 hover:text-red-600 rounded-lg text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-2 space-y-1">
              <button
                onClick={() => { onNavigate('dashboard'); setMenuOpen(false); }}
                className="block w-full text-left px-4 py-2.5 text-grove-700 bg-grove-50 rounded-lg font-semibold text-sm"
              >
                Home
              </button>
              {profile?.user_type === 'organization' && (
                <>
                  <button
                    onClick={() => { onNavigate('organization'); setMenuOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm"
                  >
                    Programs
                  </button>
                  <button
                    onClick={() => { onNavigate('participant-monitor'); setMenuOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm"
                  >
                    Monitor
                  </button>
                </>
              )}
              <button
                onClick={() => { onNavigate('trade-centre'); setMenuOpen(false); }}
                className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm"
              >
                Trade Centre
              </button>
              <button
                onClick={() => { onNavigate('agronomist'); setMenuOpen(false); }}
                className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm"
              >
                AI Agronomist
              </button>
              {isAdmin && (
                <button
                  onClick={() => { onNavigate('admin'); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5" /> Admin Panel
                </button>
              )}
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { onNavigate('profile'); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-grove-400 to-warmth-400 flex items-center justify-center flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] font-bold text-white">{(profile?.display_name || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                My Profile
              </button>
              <button
                onClick={signOut}
                className="block w-full text-left px-4 py-2.5 text-gray-700 hover:text-red-600 rounded-lg text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {isTestRunActive && !testBannerDismissed && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FlaskConical className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-amber-800 font-medium truncate">
                <span className="font-bold">Test Run mode</span> — Platform launches April 1, 2025. Explore freely, no payment required yet.
              </p>
            </div>
            <button
              onClick={() => {
                sessionStorage.setItem('ifarmx_test_banner_dismissed', '1');
                setTestBannerDismissed(true);
              }}
              className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors p-1 rounded"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {tourPhase === 'modal' && user && (
        <GuidedTour
          userId={user.id}
          displayName={displayName}
          onComplete={(selectedPath: UserType) => {
            if (selectedPath === 'organization') {
              setTourPhase('none');
              refreshProfile();
            } else {
              spotlightPathRef.current = selectedPath;
              setTourPhase('spotlight');
              refreshProfile();
            }
          }}
        />
      )}

      {tourPhase === 'spotlight' && user && (
        <SpotlightTour
          steps={spotlightPathRef.current === 'family' ? familySpotlightSteps : individualSpotlightSteps}
          userId={user.id}
          onComplete={() => {
            setTourPhase('none');
            refreshProfile();
          }}
          demoOffer={demoOffer}
          onDemoRequested={handleDemoRequested}
        />
      )}

      {tourPhase === 'demo_guide' && user && (
        <SpotlightTour
          steps={spotlightPathRef.current === 'family' ? familyPostDemoSteps : individualPostDemoSteps}
          userId={user.id}
          skipDbSave
          finishLabel="Start Exploring"
          onComplete={() => {
            sessionStorage.removeItem('ifarmx_demo_guide');
            setTourPhase('none');
          }}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {reservation && plants.length === 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-grove-600 via-grove-700 to-grove-800 shadow-lg">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
            </div>
            <div className="relative p-5 md:p-6">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Timer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Batch 1 Reservation: Confirmed
                  </h3>
                  <p className="text-grove-100 text-xs mt-0.5">
                    {reservation?.join_as === 'organisation' ? 'Organisation / Sponsor' : reservation?.join_as === 'family' ? 'Family / Group' : 'Individual Farmer'}
                    {reservation?.slots && reservation.slots > 1 ? ` — ${reservation.slots} slots` : ''}
                    {' '}— Payment Due April 1
                  </p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-sm text-white/90 leading-relaxed mb-2">
                  Kit activation pending -- admin will confirm after delivery & payment.
                  Explore the platform and familiarize yourself with the tools.
                </p>
                <div className="flex items-center gap-2 text-xs text-grove-200">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Questions? <a href="mailto:hello@ifarmx.com" className="underline hover:text-white">hello@ifarmx.com</a></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-grove-700 via-grove-800 to-earth-800 p-6 md:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-warmth-500/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-grove-400/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                  {profile?.user_type === 'organization' ? (
                    <UsersIcon className="w-4 h-4 text-warmth-300" />
                  ) : profile?.user_type === 'family' ? (
                    <UsersRound className="w-4 h-4 text-warmth-300" />
                  ) : (
                    <Sprout className="w-4 h-4 text-grove-300" />
                  )}
                  <span className="text-xs font-semibold text-white/90">
                    {profile?.user_type === 'organization' ? 'Organization' : profile?.user_type === 'family' ? 'Family / Group' : 'Individual Farmer'}
                  </span>
                </div>
              </div>
              <NotificationPanel />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('profile')}
                className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-[3px] border-white/30 hover:border-white/60 transition-colors shadow-lg"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-xl md:text-2xl font-bold text-white">{(displayName || 'U')[0].toUpperCase()}</span>
                  </div>
                )}
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {timeGreeting()}, {displayName}!
                </h1>
                <p className="text-grove-100 text-sm md:text-base max-w-xl">
                  {plants.length === 0
                    ? 'Welcome to your growing journey! Get started by purchasing and activating your first kit.'
                    : `You have ${plants.length} plant${plants.length !== 1 ? 's' : ''} growing. Keep nurturing them — persistence is the seed of every harvest.`}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-start gap-3">
            <Sun className="w-5 h-5 text-warmth-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-warmth-200 mb-0.5">Daily Wisdom</p>
              <p className="text-sm text-white/90">{tip}</p>
            </div>
          </div>
        </div>

        {pendingKitCodes.length > 0 && (
          <div className="space-y-3">
            {pendingKitCodes.map((kit) => (
              <div
                key={kit.code}
                className="relative overflow-hidden bg-gradient-to-r from-warmth-500 via-warmth-600 to-soul-500 rounded-2xl shadow-lg"
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
                </div>
                <div className="relative p-5 md:p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                      <Key className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Your Kit Code is Ready!
                      </h3>
                      <p className="text-amber-100 text-xs mt-0.5">
                        Assigned from "{kit.programName}" -- activate to start farming
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
                    <p className="text-xs text-warmth-200 font-semibold uppercase tracking-wider mb-2">Your Activation Code</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono font-black text-white text-2xl sm:text-3xl tracking-[0.15em] select-all">
                        {kit.code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(kit.code);
                          setCopiedCode(kit.code);
                          setTimeout(() => setCopiedCode(null), 2000);
                        }}
                        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                      >
                        {copiedCode === kit.code ? (
                          <><Check className="w-3.5 h-3.5" /> Copied</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy</>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('activate', kit.code)}
                    className="w-full flex items-center justify-center gap-2 bg-white text-warmth-700 py-3.5 rounded-xl font-bold hover:bg-warmth-50 transition-all shadow-md text-sm"
                  >
                    Activate This Kit Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {profile?.user_type !== 'family' && (
          <div data-tour="kit-overview">
            <SoloFarmStats
              displayName={displayName}
              plants={plants}
              weeklyLogs={weeklyLogs}
              kitCount={kitCount}
              onBuyKit={() => onNavigate('kit-purchase')}
              onActivateKit={() => onNavigate('activate')}
            />
          </div>
        )}

        {profile?.user_type === 'family' && (
          <div data-tour="family-panel">
            <FamilyDynastyPanel plants={plants} onNavigate={onNavigate} />
          </div>
        )}

        {user && profile?.user_type !== 'organization' && (
          <OpenProgramsBanner userId={user.id} onNavigate={onNavigate} />
        )}

        <DailyReminder plants={plants} weeklyLogs={weeklyLogs} onNavigate={onNavigate} onLogsUpdated={loadData} />

        <div data-tour="quick-actions" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('achievements')}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-all hover:border-warmth-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-warmth-400 to-warmth-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Achievements</h3>
            <p className="text-xs text-gray-500 mt-1">Your awards & appreciations</p>
          </button>

          <button
            onClick={() => onNavigate('trade-centre')}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-all hover:border-grove-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-grove-400 to-grove-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Store className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Trade Centre</h3>
            <p className="text-xs text-gray-500 mt-1">Buy kits, track orders & marketplace</p>
          </button>

          <button
            onClick={() => onNavigate('agronomist')}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-all hover:border-warmth-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-warmth-400 to-soul-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">AI Agronomist</h3>
            <p className="text-xs text-gray-500 mt-1">Ask farming questions anytime</p>
          </button>

          <button
            onClick={() => onNavigate('open-programs')}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-all hover:border-blue-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Open Programs</h3>
            <p className="text-xs text-gray-500 mt-1">Browse & apply to farming programs</p>
          </button>
        </div>
      </main>
    </div>
  );
}
