import { useEffect, useState } from 'react';
import { getDashboard } from '../../api';
import type { DashboardData } from '../../api';
import { DashboardKpis } from './DashboardKpis';
import { NoticeBoard } from './NoticeBoard';
import { TopPerformers } from './TopPerformers';
import type { AppView } from '../Layout/navItems';

type HomeDashboardProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  onNavigate?: (view: AppView) => void;
  onReply?: (communicationId: string) => void;
};

export function HomeDashboard({ onOpenMobileMenu, onOpenProfile, onNavigate, onReply }: HomeDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboard()
      .then((result) => {
        if (!cancelled) {
          setData(result);
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
    <>
      <DashboardKpis
        kpis={data?.kpis ?? null}
        loading={loading}
        error={error}
        onOpenMobileMenu={onOpenMobileMenu}
        onOpenProfile={onOpenProfile}
        onNavigate={onNavigate}
      />
      <div className="home-lower">
        <NoticeBoard
          notices={data?.notices ?? []}
          loading={loading}
          onReply={onReply}
        />
        <TopPerformers performers={data?.top_performers ?? []} loading={loading} />
      </div>
    </>
  );
}
