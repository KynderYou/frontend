import { useEffect, useState } from 'react';
import './App.css';
import { getMe, getToken, logout as apiLogout } from './api';
import type { Member } from './api';
import { getThemeCssVars } from './styles/theme';
import { Sidebar } from './components/Layout/Sidebar';
import { MobileNavDrawer } from './components/Layout/MobileNavDrawer';
import type { AppView } from './components/Layout/navItems';
import { DashboardKpis } from './components/Home/DashboardKpis';
import { NoticeBoard } from './components/Home/NoticeBoard';
import { TopPerformers } from './components/Home/TopPerformers';
import { ProfilePage } from './components/Profile/ProfilePage';
import { PlaceholderPage } from './components/Placeholder/PlaceholderPage';
import { LedgerPage } from './components/Ledger/LedgerPage';
import { ScansMlaPage } from './components/Scans/ScansMlaPage';
import { ReportsPage } from './components/Reports/ReportsPage';
import { AuthPage } from './components/Auth/AuthPage';
import { AdminMembersPage } from './components/Admin/AdminMembersPage';
import { TraineesPage } from './components/Trainees/TraineesPage';
import { CommunicationsPage } from './components/Communications/CommunicationsPage';
import { MisScansPage } from './components/Mis/MisScansPage';
import { NetworkPerformancePage } from './components/Mis/NetworkPerformancePage';

/** Covers iPhone 14 Pro Max (430px) and similar phones / small tablets */
const MOBILE_QUERY = '(max-width: 860px)';

type PlaceholderViewId = Exclude<
  AppView,
  | 'dashboard'
  | 'profile'
  | 'ledger'
  | 'scans-mla'
  | 'reports'
  | 'admin-members'
  | 'trainees'
  | 'mis-communications'
  | 'mis-scans'
  | 'mis-network'
>;

/** Stub copy for the sections not yet built out — refine per-page as each is implemented */
const placeholderPages: Record<PlaceholderViewId, { title: string; subtitle: string; actions?: string[] }> = {
  'scans-ho': {
    title: 'My Scans (H.O)',
    subtitle: 'Preprocess, verify, and manage scan data at the Head Office.',
    actions: ['Preprocess', 'Verify', 'Data Download', 'Report Upload'],
  },
  'mis-cab': {
    title: 'MIS · CAB',
    subtitle: 'Manage CAB debit and delete actions.',
    actions: ['Debit', 'Delete'],
  },
};

/** Views whose panels manage their own scrolling and should fill the viewport height */
const fillViews = new Set<AppView>(['trainees', 'mis-scans']);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(() => Boolean(getToken()));
  const [, setMember] = useState<Member | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [view, setView] = useState<AppView>('dashboard');
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false
  );

  useEffect(() => {
    const vars = getThemeCssVars('light');
    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setAuthChecking(false);
      return;
    }

    let cancelled = false;
    getMe()
      .then((current) => {
        if (cancelled) return;
        setMember(current);
        setIsAuthenticated(true);
      })
      .catch(() => {
        if (cancelled) return;
        void apiLogout().catch(() => undefined);
        setMember(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (!cancelled) setAuthChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const onChange = () => {
      const mobile = media.matches;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    void apiLogout().catch(() => undefined);
    setMember(null);
    setView('dashboard');
    setMobileMenuOpen(false);
    setIsAuthenticated(false);
  };

  if (authChecking) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        onAuthenticated={(current) => {
          setMember(current);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className={`app-frame ${isMobile ? 'is-mobile' : ''}`}>
      <div className="app-shell">
        {!isMobile && (
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
            activeView={view}
            onNavigate={setView}
            onLogout={handleLogout}
          />
        )}
        <div className={`app-main${fillViews.has(view) ? ' app-main--fill' : ''}`}>
          <main className={`app-content panel${fillViews.has(view) ? ' app-content--fill' : ''}`}>
            {view === 'profile' ? (
              <ProfilePage
                onBack={() => setView('dashboard')}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
              />
            ) : view === 'dashboard' ? (
              <>
                <DashboardKpis
                  onOpenMobileMenu={() => setMobileMenuOpen(true)}
                  onOpenProfile={() => setView('profile')}
                  onNavigate={setView}
                />
                <div className="home-lower">
                  <NoticeBoard />
                  <TopPerformers />
                </div>
              </>
            ) : view === 'ledger' ? (
              <LedgerPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => setView('profile')}
              />
            ) : view === 'scans-mla' ? (
              <ScansMlaPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => setView('profile')}
              />
            ) : view === 'reports' ? (
              <ReportsPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => setView('profile')}
              />
            ) : view === 'admin-members' ? (
              <AdminMembersPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => setView('profile')}
              />
            ) : view === 'trainees' ? (
              <TraineesPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => setView('profile')}
              />
            ) : view === 'mis-communications' ? (
              <CommunicationsPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => setView('profile')}
              />
            ) : view === 'mis-scans' ? (
              <MisScansPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => setView('profile')}
              />
            ) : view === 'mis-network' ? (
              <NetworkPerformancePage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => setView('profile')}
              />
            ) : (
              <PlaceholderPage
                {...placeholderPages[view]}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => setView('profile')}
              />
            )}
          </main>
        </div>
      </div>

      {isMobile && (
        <MobileNavDrawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activeView={view}
          onNavigate={setView}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
