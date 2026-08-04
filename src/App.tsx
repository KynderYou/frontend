import { useEffect, useState } from 'react';
import './App.css';
import { getMe, getToken, logout as apiLogout } from './api';
import type { Member } from './api';
import { getThemeCssVars } from './styles/theme';
import { Sidebar } from './components/Layout/Sidebar';
import { MobileNavDrawer } from './components/Layout/MobileNavDrawer';
import { isAppView, type AppView } from './components/Layout/navItems';
import { DashboardKpis } from './components/Home/DashboardKpis';
import { NoticeBoard } from './components/Home/NoticeBoard';
import { TopPerformers } from './components/Home/TopPerformers';
import { ProfilePage } from './components/Profile/ProfilePage';
import { LedgerPage } from './components/Ledger/LedgerPage';
import { ScansMlaPage } from './components/Scans/ScansMlaPage';
import { ScansHoPage } from './components/Scans/ScansHoPage';
import { ReportsPage } from './components/Reports/ReportsPage';
import { AuthPage } from './components/Auth/AuthPage';
import { AdminMembersPage } from './components/Admin/AdminMembersPage';
import { TraineesPage } from './components/Trainees/TraineesPage';
import { MentorTraineesPage } from './components/Trainees/MentorTraineesPage';
import { MlasPage } from './components/Mlas/MlasPage';
import { MentorMlasPage } from './components/Mlas/MentorMlasPage';
import { CommunicationsPage } from './components/Communications/CommunicationsPage';
import { MisScansPage } from './components/Mis/MisScansPage';
import { NetworkPerformancePage } from './components/Mis/NetworkPerformancePage';
import { MisCabPage } from './components/Mis/MisCabPage';

/** Covers iPhone 14 Pro Max (430px) and similar phones / small tablets */
const MOBILE_QUERY = '(max-width: 860px)';

/** Views whose panels manage their own scrolling and should fill the viewport height */
const fillViews = new Set<AppView>(['trainees', 'mlas', 'mis-scans', 'mis-cab']);

const DEFAULT_VIEW: AppView = 'dashboard';

type HashState = {
  view: AppView;
  threadId: string | null;
};

/** The URL hash is the source of truth for the current page, so refresh keeps you here.
 *  Thread deep-links look like `#/mis-communications?thread=c1`. */
function parseHash(): HashState {
  if (typeof window === 'undefined') return { view: DEFAULT_VIEW, threadId: null };
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  const view = isAppView(pathPart) ? pathPart : DEFAULT_VIEW;
  const threadId = new URLSearchParams(queryPart).get('thread');
  return { view, threadId };
}

function writeHash(view: AppView, threadId: string | null = null) {
  if (view === 'mis-communications' && threadId) {
    window.location.hash = `#/${view}?thread=${encodeURIComponent(threadId)}`;
    return;
  }
  window.location.hash = `#/${view}`;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(() => Boolean(getToken()));
  const [, setMember] = useState<Member | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [view, setView] = useState<AppView>(() => parseHash().view);
  const [threadId, setThreadId] = useState<string | null>(() => parseHash().threadId);
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
    const current = parseHash();
    if (current.view !== view || current.threadId !== threadId) {
      writeHash(view, threadId);
    }
  }, [view, threadId]);

  useEffect(() => {
    const onHashChange = () => {
      const next = parseHash();
      setView(next.view);
      setThreadId(next.threadId);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (nextView: AppView) => {
    setView(nextView);
    if (nextView !== 'mis-communications') setThreadId(null);
  };

  const openCommunicationThread = (id: string) => {
    setThreadId(id);
    setView('mis-communications');
  };

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
    setThreadId(null);
    setView(DEFAULT_VIEW);
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
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        )}
        <div className={`app-main${fillViews.has(view) ? ' app-main--fill' : ''}`}>
          <main className={`app-content panel${fillViews.has(view) ? ' app-content--fill' : ''}`}>
            {view === 'profile' ? (
              <ProfilePage
                onBack={() => navigate('dashboard')}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
              />
            ) : view === 'dashboard' ? (
              <>
                <DashboardKpis
                  onOpenMobileMenu={() => setMobileMenuOpen(true)}
                  onOpenProfile={() => navigate('profile')}
                  onNavigate={navigate}
                />
                <div className="home-lower">
                  <NoticeBoard onReply={openCommunicationThread} />
                  <TopPerformers />
                </div>
              </>
            ) : view === 'ledger' ? (
              <LedgerPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'scans-mla' ? (
              <ScansMlaPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'scans-ho' ? (
              <ScansHoPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'reports' ? (
              <ReportsPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'admin-members' ? (
              <AdminMembersPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'trainees' ? (
              <TraineesPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'mlas' ? (
              <MlasPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'mentor-trainees' ? (
              <MentorTraineesPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'mentor-mlas' ? (
              <MentorMlasPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'mis-communications' ? (
              <CommunicationsPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
                initialThreadId={threadId}
                onThreadSelect={setThreadId}
              />
            ) : view === 'mis-scans' ? (
              <MisScansPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'mis-network' ? (
              <NetworkPerformancePage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : view === 'mis-cab' ? (
              <MisCabPage
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                onOpenProfile={() => navigate('profile')}
              />
            ) : null}
          </main>
        </div>
      </div>

      {isMobile && (
        <MobileNavDrawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activeView={view}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
