import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrgDashboardPage } from './pages/OrgDashboardPage';
import { ActivateKitPage } from './pages/ActivateKitPage';
import { PlantDetailPage } from './pages/PlantDetailPage';
import { AgronomistPage } from './pages/AgronomistPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { ProgramDetailPage } from './pages/ProgramDetailPage';
import { OpenProgramsPage } from './pages/OpenProgramsPage';
import { TradeCentrePage } from './pages/TradeCentrePage';
import { KitPurchasePage } from './pages/KitPurchasePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { ParticipantMonitorPage } from './pages/ParticipantMonitorPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LandingPage } from './pages/LandingPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ReservationPage } from './pages/ReservationPage';
import { ReservationConfirmPage } from './pages/ReservationConfirmPage';
import type { Plant, KitOrder } from './types/database';
import { trackPageView } from './services/analytics';

type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'activate' | 'plant' | 'agronomist' | 'organization' | 'program-detail' | 'open-programs' | 'trade-centre' | 'kit-purchase' | 'marketplace' | 'order-tracking' | 'participant-monitor' | 'admin' | 'achievements' | 'profile' | 'forgot-password' | 'reset-password' | 'reserve' | 'reservation-confirm';

function AppContent() {
  const { user, loading, profile } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<KitOrder | null>(null);
  const [monitorProgramId, setMonitorProgramId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [prefilledKitCode, setPrefilledKitCode] = useState<string | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const [reservedEmail, setReservedEmail] = useState<string>('');
  const [showDashboardTour, setShowDashboardTour] = useState(false);
  const adminChecked = useRef(false);

  useEffect(() => {
    if (!loading && user) {
      if (isRecovery) {
        setCurrentPage('reset-password');
        return;
      }
      if (currentPage === 'reserve') {
        setCurrentPage('reservation-confirm');
        return;
      }
      if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'signup' || currentPage === 'forgot-password') {
        const deepLink = sessionStorage.getItem('ifarmx_deep_link');
        if (deepLink) {
          sessionStorage.removeItem('ifarmx_deep_link');
          window.history.replaceState({}, '', window.location.pathname);
          setCurrentPage(deepLink as Page);
        } else {
          setCurrentPage('dashboard');
        }
      }
      if (profile && !adminChecked.current) {
        adminChecked.current = true;
        const flag = sessionStorage.getItem('_ap');
        if (flag === '1' && profile.is_admin) {
          sessionStorage.removeItem('_ap');
          setCurrentPage('admin');
        }
      }
    }
    if (!loading && !user) {
      const isTemp = localStorage.getItem('ifarmx_session_temp') === '1';
      const isActive = sessionStorage.getItem('ifarmx_active') === '1';
      if (isTemp && !isActive) {
        localStorage.removeItem('ifarmx_session_temp');
      }
      const deepLink = sessionStorage.getItem('ifarmx_deep_link');
      if (deepLink === 'forgot-password') {
        sessionStorage.removeItem('ifarmx_deep_link');
        window.history.replaceState({}, '', window.location.pathname);
        setCurrentPage('forgot-password');
      }
    }
  }, [loading, user, profile, currentPage, isRecovery]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'recovery' || window.location.hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    const deepPage = params.get('page');
    const validPages: Page[] = ['dashboard', 'activate', 'agronomist', 'organization', 'open-programs', 'trade-centre', 'kit-purchase', 'marketplace', 'order-tracking', 'admin', 'achievements', 'profile', 'forgot-password'];
    if (deepPage && validPages.includes(deepPage as Page)) {
      sessionStorage.setItem('ifarmx_deep_link', deepPage);
    }
  }, []);

  const prevPageRef = useRef<string>('login');

  const handleNavigate = (page: string, data?: any) => {
    if (page === 'plant' && data) {
      setSelectedPlant(data);
    }
    if (page === 'order-tracking' && data) {
      setSelectedOrder(data);
    }
    if (page === 'participant-monitor' && data) {
      setMonitorProgramId(data);
    }
    if (page === 'program-detail' && data) {
      setSelectedProgramId(data);
    }
    if (page === 'activate' && typeof data === 'string') {
      setPrefilledKitCode(data);
    } else if (page === 'activate') {
      setPrefilledKitCode(null);
    }

    trackPageView(page, user?.id, prevPageRef.current);
    prevPageRef.current = page;

    setCurrentPage(page as Page);
  };

  if (loading) {
    return (
      <div className="min-h-screen african-warm-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-grove-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-earth-700 font-semibold">Loading iFarmX...</p>
          <p className="text-earth-400 text-xs mt-1">Growing something beautiful</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'reserve') {
      return (
        <ReservationPage
          onNavigate={handleNavigate}
          onReserved={(email) => {
            setReservedEmail(email);
            setShowDashboardTour(true);
          }}
        />
      );
    }
    if (currentPage === 'signup') {
      return <SignupPage onNavigate={handleNavigate} />;
    }
    if (currentPage === 'forgot-password') {
      return <ForgotPasswordPage onNavigate={handleNavigate} />;
    }
    if (currentPage === 'login') {
      return <LoginPage onNavigate={handleNavigate} />;
    }
    return <LandingPage onGetStarted={() => handleNavigate('reserve')} onLogin={() => handleNavigate('login')} />;
  }

  const isOrg = profile?.user_type === 'organization';

  if (currentPage === 'reset-password' || isRecovery) {
    return (
      <ResetPasswordPage
        onNavigate={handleNavigate}
        onComplete={() => {
          setIsRecovery(false);
          window.history.replaceState({}, '', window.location.pathname);
          handleNavigate('dashboard');
        }}
      />
    );
  }

  if (currentPage === 'reservation-confirm') {
    return (
      <ReservationConfirmPage
        email={reservedEmail || user?.email || ''}
        onEnterPlatform={() => {
          setShowDashboardTour(true);
          handleNavigate('dashboard');
        }}
      />
    );
  }

  switch (currentPage) {
    case 'activate':
      return (
        <ActivateKitPage
          onNavigate={handleNavigate}
          onActivated={() => handleNavigate('dashboard')}
          prefilledCode={prefilledKitCode}
        />
      );
    case 'plant':
      return selectedPlant ? (
        <PlantDetailPage plant={selectedPlant} onNavigate={handleNavigate} />
      ) : (
        <DashboardPage onNavigate={handleNavigate} />
      );
    case 'agronomist':
      return <AgronomistPage onNavigate={handleNavigate} />;
    case 'organization':
      return <OrganizationPage onNavigate={handleNavigate} />;
    case 'program-detail':
      return selectedProgramId ? (
        <ProgramDetailPage programId={selectedProgramId} onNavigate={handleNavigate} />
      ) : (
        <OrganizationPage onNavigate={handleNavigate} />
      );
    case 'open-programs':
      return <OpenProgramsPage onNavigate={handleNavigate} />;
    case 'trade-centre':
      return <TradeCentrePage onNavigate={handleNavigate} />;
    case 'kit-purchase':
      return <KitPurchasePage onNavigate={handleNavigate} />;
    case 'marketplace':
      return <MarketplacePage onNavigate={handleNavigate} />;
    case 'order-tracking':
      return <OrderTrackingPage onNavigate={handleNavigate} initialOrder={selectedOrder} />;
    case 'participant-monitor':
      return <ParticipantMonitorPage onNavigate={handleNavigate} initialProgramId={monitorProgramId} />;
    case 'achievements':
      return <AchievementsPage onNavigate={handleNavigate} />;
    case 'admin':
      return <AdminDashboardPage onNavigate={handleNavigate} />;
    case 'profile':
      return <ProfilePage onNavigate={handleNavigate} />;
    default:
      return isOrg
        ? <OrgDashboardPage onNavigate={handleNavigate} />
        : <DashboardPage onNavigate={handleNavigate} showTour={showDashboardTour} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
