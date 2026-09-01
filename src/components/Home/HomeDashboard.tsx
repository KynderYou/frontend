import { useEffect, useState } from 'react';
import { getCommunicationsNotices, getDashboard, getTopPerformers } from '../../api';
import type { DashboardData, DashboardNotice, MemberNav, TopPerformer } from '../../api';
import { mapCommunicationsToDashboardNotices } from '../Communications/communicationsApiMapper';
import { DashboardKpis } from './DashboardKpis';
import { NoticeBoard } from './NoticeBoard';
import { TopPerformers } from './TopPerformers';
import type { AppView } from '../Layout/navItems';

type HomeDashboardProps = {
  nav?: MemberNav;
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  onNavigate?: (view: AppView, target?: string) => void;
  onReply?: (communicationId: string) => void;
};

export function HomeDashboard({ nav, onOpenMobileMenu, onOpenProfile, onNavigate, onReply }: HomeDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [notices, setNotices] = useState<DashboardNotice[]>([]);
  const [performers, setPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getDashboard(), getCommunicationsNotices(), getTopPerformers()])
      .then(([dashboard, noticesData, topPerformers]) => {
        if (!cancelled) {
          setData(dashboard);
          setNotices(mapCommunicationsToDashboardNotices(noticesData));
          setPerformers(topPerformers);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load dashboard.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="home-dashboard">
      <DashboardKpis
        kpis={data?.kpis ?? null}
        nav={nav}
        loading={loading}
        error={error}
        onOpenMobileMenu={onOpenMobileMenu}
        onOpenProfile={onOpenProfile}
        onNavigate={onNavigate}
      />
      <div className="home-lower">
        <NoticeBoard notices={notices} loading={loading} onReply={onReply} />
        <TopPerformers performers={performers} loading={loading} />
      </div>
    </div>
  );
}
