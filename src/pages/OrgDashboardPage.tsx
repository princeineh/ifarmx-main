import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Leaf, Menu, X, Plus, Users, FolderOpen, BarChart3,
  Clock, CheckCircle, AlertCircle, ArrowRight, Globe, Lock, Shield, Award, Star,
  ChevronDown, ChevronUp
} from 'lucide-react';
import type { Program } from '../types/database';
import { SpotlightTour } from '../components/dashboard/SpotlightTour';
import { orgSpotlightSteps, orgPostDemoSteps } from '../components/dashboard/tourSteps';
import { setupDemo } from '../services/demoSetup';
import type { DemoOffer } from '../components/dashboard/SpotlightTour';

interface OrgDashboardPageProps {
  onNavigate: (page: string, data?: any) => void;
}

interface ProgramSummary extends Program {
  participant_count: number;
  application_count: number;
  kits_assigned: number;
}

const timeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export function OrgDashboardPage({ onNavigate }: OrgDashboardPageProps) {
  const { user, profile, signOut, isAdmin, loading: authLoading, refreshProfile } = useAuth();
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showDemoGuide, setShowDemoGuide] = useState(false);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [ambassadorExpanded, setAmbassadorExpanded] = useState(false);
  const [programsExpanded, setProgramsExpanded] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (loading || !profile) return;
    const demoGuideFlag = sessionStorage.getItem('ifarmx_demo_guide');
    if (demoGuideFlag === 'organization') {
      setShowDemoGuide(true);
      return;
    }
    const flag = sessionStorage.getItem('ifarmx_spotlight');
    if (flag === 'organization' && !profile.tour_completed) {
      setShowSpotlight(true);
    }
  }, [loading, profile]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: programsData } = await supabase
        .from('programs')
        .select('*')
        .eq('org_user_id', user.id)
        .order('created_at', { ascending: false });

      if (programsData && programsData.length > 0) {
        const programIds = programsData.map(p => p.id);

        const [allParts, allApps, allKits] = await Promise.all([
          supabase.from('program_participants').select('program_id').in('program_id', programIds),
          supabase.from('program_applications').select('program_id').in('program_id', programIds),
          supabase.from('program_participants').select('program_id').in('program_id', programIds).eq('kit_code_assigned', true),
        ]);

        const partCounts: Record<string, number> = {};
        const appCounts: Record<string, number> = {};
        const kitCounts: Record<string, number> = {};

        for (const id of programIds) {
          partCounts[id] = 0;
          appCounts[id] = 0;
          kitCounts[id] = 0;
        }

        (allParts.data || []).forEach(r => { partCounts[r.program_id] = (partCounts[r.program_id] || 0) + 1; });
        (allApps.data || []).forEach(r => { appCounts[r.program_id] = (appCounts[r.program_id] || 0) + 1; });
        (allKits.data || []).forEach(r => { kitCounts[r.program_id] = (kitCounts[r.program_id] || 0) + 1; });

        let allParticipants = 0;
        let allApplications = 0;

        const summaries: ProgramSummary[] = programsData.map(program => {
          const pCount = partCounts[program.id] || 0;
          const aCount = appCounts[program.id] || 0;
          const kCount = kitCounts[program.id] || 0;
          allParticipants += pCount;
          allApplications += aCount;
          return { ...program, participant_count: pCount, application_count: aCount, kits_assigned: kCount };
        });

        setPrograms(summaries);
        setTotalParticipants(allParticipants);
        setTotalApplications(allApplications);
      } else {
        setPrograms([]);
        setTotalParticipants(0);
        setTotalApplications(0);
      }
    } catch (err) {
      console.error('OrgDashboard: Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.display_name || 'Organizer';

  const orgDemoOffer: DemoOffer = {
    title: 'Ready to Try It Out?',
    body: "We'll create a demo program so you can explore participant management, kit distribution, and progress tracking with real data.",
    buttonLabel: 'Set Up My Demo Program',
    loadingText: 'Creating your demo program...',
  };

  const handleOrgDemoRequested = async () => {
    if (!user) return;
    try {
      await setupDemo(user.id, 'organization');
      await supabase
        .from('user_profiles')
        .update({ tour_completed: true })
        .eq('id', user.id);
      sessionStorage.removeItem('ifarmx_spotlight');
      sessionStorage.setItem('ifarmx_demo_guide', 'organization');
      await loadData();
      await refreshProfile();
      setShowSpotlight(false);
      setShowDemoGuide(true);
    } catch (error) {
      console.error('Error setting up demo:', error);
      alert('There was an error setting up the demo. Please try again or contact support.');
      setShowSpotlight(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mud-texture adinkra-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 stage-pulse">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-700 font-semibold">Loading your programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm border-b-4 kente-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-full flex items-center justify-center shadow-md">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-african font-bold text-lg text-earth-900 leading-tight block">iFarmX</span>
                <span className="text-[10px] text-kente-gold font-semibold tracking-wider uppercase">Program Management</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 text-emerald-700 bg-emerald-50 rounded-lg font-semibold text-sm"
              >
                Dashboard
              </button>
              <button
                data-tour="nav-programs"
                onClick={() => onNavigate('organization')}
                className="px-4 py-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg font-semibold text-sm transition-colors"
              >
                Programs
              </button>
              <button
                data-tour="nav-trade-centre"
                onClick={() => onNavigate('trade-centre')}
                className="px-4 py-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg font-semibold text-sm transition-colors"
              >
                Trade Centre
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
                onClick={() => onNavigate('profile')}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-earth-200 hover:border-emerald-400 transition-colors flex-shrink-0"
                title="My Profile"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-amber-400 flex items-center justify-center">
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
              <button onClick={() => { onNavigate('dashboard'); setMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-emerald-700 bg-emerald-50 rounded-lg font-semibold text-sm">Dashboard</button>
              <button onClick={() => { onNavigate('organization'); setMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm">Programs</button>
              <button onClick={() => { onNavigate('trade-centre'); setMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm">Trade Centre</button>
              {isAdmin && (
                <button onClick={() => { onNavigate('admin'); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Admin Panel
                </button>
              )}
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { onNavigate('profile'); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-sm flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-amber-400 flex items-center justify-center flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] font-bold text-white">{(profile?.display_name || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                My Profile
              </button>
              <button onClick={signOut} className="block w-full text-left px-4 py-2.5 text-gray-700 hover:text-red-600 rounded-lg text-sm">Sign Out</button>
            </div>
          </div>
        )}
      </nav>

      {showSpotlight && user && (
        <SpotlightTour
          steps={orgSpotlightSteps}
          userId={user.id}
          onComplete={() => {
            setShowSpotlight(false);
            refreshProfile();
          }}
          demoOffer={orgDemoOffer}
          onDemoRequested={handleOrgDemoRequested}
        />
      )}

      {showDemoGuide && user && (
        <SpotlightTour
          steps={orgPostDemoSteps}
          userId={user.id}
          skipDbSave
          finishLabel="Start Exploring"
          onComplete={() => {
            sessionStorage.removeItem('ifarmx_demo_guide');
            setShowDemoGuide(false);
          }}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-amber-900 p-6 md:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                <Users className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-semibold text-white/90">Organization</span>
              </div>
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
                <p className="text-emerald-100 text-sm md:text-base max-w-xl">
                  {programs.length === 0
                    ? 'Welcome to your program management dashboard. Create your first program to start onboarding participants.'
                    : `You have ${programs.length} program${programs.length !== 1 ? 's' : ''} running. Manage applications, monitor participants, and assign kits.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div data-tour="org-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-3">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{programs.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Programs</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalParticipants}</p>
            <p className="text-xs text-gray-500 mt-1">Active Participants</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
            <p className="text-xs text-gray-500 mt-1">Pending Applications</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {programs.filter(p => p.status === 'published').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Published Programs</p>
          </div>
        </div>

        <div data-tour="program-list" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">Your Programs</h2>
              {programs.length > 3 && (
                <button
                  onClick={() => setProgramsExpanded(!programsExpanded)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                >
                  {programsExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Show All ({programs.length})
                    </>
                  )}
                </button>
              )}
            </div>
            <button
              data-tour="new-program"
              onClick={() => onNavigate('organization')}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:from-emerald-600 hover:to-emerald-700 inline-flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Program
            </button>
          </div>

          {programs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Programs Yet</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                Create your first program to start recruiting participants and managing your farming initiative.
              </p>
              <button
                onClick={() => onNavigate('organization')}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Program
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(programsExpanded ? programs : programs.slice(0, 3)).map((program) => (
                <div
                  key={program.id}
                  className="group border border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onNavigate('program-detail', program.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{program.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(program.status)}`}>
                          {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                        </span>
                        {program.acceptance_type === 'open' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                            <Globe className="w-3 h-3" /> Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                            <Lock className="w-3 h-3" /> Invite Only
                          </span>
                        )}
                      </div>
                      {program.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">{program.description}</p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Participants: </span>
                      <span className="font-semibold text-gray-900">{program.participant_count}/{program.target_participants}</span>
                    </div>
                    {program.application_count > 0 && (
                      <div>
                        <span className="text-gray-500">Applications: </span>
                        <span className="font-semibold text-amber-600">{program.application_count}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Kits Assigned: </span>
                      <span className="font-semibold text-green-600">{program.kits_assigned}</span>
                    </div>
                    {program.start_date && (
                      <div className="hidden sm:block">
                        <span className="text-gray-500">Start: </span>
                        <span className="font-semibold text-gray-700">{new Date(program.start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {program.participant_count < program.target_participants && program.application_count > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-amber-600 font-medium">
                        {program.application_count} application{program.application_count !== 1 ? 's' : ''} waiting for review
                      </span>
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (program.participant_count / program.target_participants) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {Math.round((program.participant_count / program.target_participants) * 100)}% of target filled
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div data-tour="org-quick-actions" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('organization')}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-all hover:border-emerald-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Manage Programs</h3>
            <p className="text-xs text-gray-500 mt-1">Create, publish, and configure your programs</p>
          </button>

          <button
            data-tour="org-trade-centre"
            onClick={() => onNavigate('trade-centre')}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-all hover:border-amber-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Trade Centre</h3>
            <p className="text-xs text-gray-500 mt-1">Purchase kits and manage orders</p>
          </button>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 rounded-2xl shadow-sm border-2 border-dashed border-purple-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-200/20 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative">
            <button
              onClick={() => setAmbassadorExpanded(!ambassadorExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/30 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">Ambassador Program</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full">
                      <Star className="w-2.5 h-2.5" />
                      COMING SOON
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">Select and empower top performers to mentor others</p>
                </div>
              </div>
              {ambassadorExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
              )}
            </button>

            {ambassadorExpanded && (
              <div className="px-4 pb-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Select Top Performers</h4>
                      <p className="text-xs text-gray-600 mt-0.5">Choose your best participants after 1 month of consistent care and progress</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Award className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Multi-Level Ambassador Tiers</h4>
                      <p className="text-xs text-gray-600 mt-0.5">Bronze, Silver, Gold, and Platinum levels based on impact and mentorship</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BarChart3 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Mentor & Encourage</h4>
                      <p className="text-xs text-gray-600 mt-0.5">Ambassadors can guide, supervise, and send encouragement to other participants</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">This feature will be available in an upcoming update. Stay tuned!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
