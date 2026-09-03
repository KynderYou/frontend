import type { CSSProperties, ReactNode } from 'react';

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({ width = '100%', height = 14, circle = false, className = '', style }: SkeletonProps) {
  return (
    <span
      className={`skeleton${circle ? ' skeleton-circle' : ''}${className ? ` ${className}` : ''}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

function SkeletonCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`dash-card skeleton-card${className ? ` ${className}` : ''}`}>{children}</div>;
}

function SkeletonKpiCard({ featured = false }: { featured?: boolean }) {
  return (
    <article
      className={`kpi-card skeleton-kpi-card${featured ? ' is-featured' : ''}`}
      aria-hidden="true"
      style={featured ? { background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <Skeleton width={112} height={18} className={featured ? 'skeleton-invert' : ''} />
        <Skeleton circle width={40} height={40} className={featured ? 'skeleton-invert' : ''} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Skeleton width={140} height={38} className={featured ? 'skeleton-invert' : ''} />
        <Skeleton width={168} height={18} style={{ marginTop: 6 }} className={featured ? 'skeleton-invert' : ''} />
      </div>
    </article>
  );
}

export function SkeletonLine({ width = '100%' }: { width?: string | number }) {
  return <Skeleton width={width} height={12} />;
}

export function SkeletonSubtitle() {
  return <Skeleton width="min(420px, 72%)" height={14} style={{ marginTop: 8 }} />;
}

export function SkeletonKpiGrid({ count = 2, columns = 4 }: { count?: number; columns?: 2 | 4 }) {
  const isLedger = columns === 2;
  return (
    <div
      className={isLedger ? 'ledger-kpi-grid skeleton-kpi-grid' : 'kpi-grid skeleton-kpi-grid'}
      style={
        isLedger
          ? {
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 20,
              marginBottom: 24,
            }
          : undefined
      }
    >
      {Array.from({ length: count }, (_, index) => (
        <SkeletonKpiCard key={index} featured={isLedger && index === 0} />
      ))}
    </div>
  );
}

export function SkeletonTxRows({ rows = 6, variant = 'default' }: { rows?: number; variant?: 'default' | 'ledger' }) {
  return (
    <div className="skeleton-tx-rows">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={`skeleton-tx-row${variant === 'ledger' ? ' skeleton-tx-row--ledger' : ''}`}>
          <Skeleton circle width={44} height={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton width={`${72 - (index % 3) * 6}%`} height={15} style={{ marginBottom: 2 }} />
            <Skeleton width={88} height={12} />
          </div>
          <Skeleton width={72} height={15} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonExpensesChart() {
  const barHeights = [52, 84, 38, 112, 68, 94, 44, 76, 58, 102, 48, 88];

  return (
    <div className="dash-card skeleton-expenses-chart">
      <div className="skeleton-expenses-header">
        <Skeleton width={92} height={20} />
        <Skeleton width={36} height={13} />
      </div>
      <div className="skeleton-expenses-body">
        <div className="skeleton-expenses-bars" aria-hidden="true">
          {barHeights.map((height, index) => (
            <Skeleton key={index} className="skeleton-expenses-bar" height={height} />
          ))}
        </div>
        <div className="skeleton-expenses-labels" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <Skeleton key={index} width="100%" height={11} className="skeleton-expenses-label" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonLedgerBody() {
  return (
    <>
      <SkeletonKpiGrid count={2} columns={2} />
      <div className="ledger-lower skeleton-ledger-lower">
        <div className="dash-card skeleton-ledger-receipts">
          <div className="skeleton-ledger-receipts-head">
            <Skeleton width={88} height={20} />
            <Skeleton width={168} height={13} />
          </div>
          <SkeletonTxRows rows={8} variant="ledger" />
          <div className="mis-table-footer skeleton-ledger-pager">
            <Skeleton width={108} height={13} />
            <div className="mis-pager">
              <Skeleton width={76} height={32} />
              <Skeleton width={56} height={32} />
            </div>
          </div>
        </div>
        <SkeletonExpensesChart />
      </div>
    </>
  );
}

export function SkeletonMemberScansTable({ rows = 5 }: { rows?: number }) {
  const safeRows = Math.min(Math.max(rows, 1), 10);

  return (
    <>
      <div className="member-scans-table-wrap">
        <table className="member-scans-table member-scans-table--skeleton" aria-hidden="true">
          <colgroup>
            <col className="col-sno" />
            <col className="col-scan-id" />
            <col className="col-name" />
            <col className="col-gender" />
            <col className="col-report" />
            <col className="col-cost" />
            <col className="col-uploaded" />
            <col className="col-status" />
          </colgroup>
          <thead>
            <tr>
              <th>Sno</th>
              <th>Scan Id</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Report Type</th>
              <th>Cost</th>
              <th>Uploaded</th>
              <th className="col-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: safeRows }, (_, index) => (
              <tr key={index}>
                <td>
                  <Skeleton width={18} height={13} className="member-scans-skeleton-cell" />
                </td>
                <td>
                  <Skeleton width={104} height={13} className="member-scans-skeleton-cell" />
                </td>
                <td>
                  <Skeleton width={88} height={13} className="member-scans-skeleton-cell" />
                </td>
                <td>
                  <Skeleton width={48} height={13} className="member-scans-skeleton-cell" />
                </td>
                <td>
                  <Skeleton width={72} height={13} className="member-scans-skeleton-cell" />
                </td>
                <td>
                  <Skeleton width={56} height={13} className="member-scans-skeleton-cell" />
                </td>
                <td>
                  <Skeleton width={152} height={13} className="member-scans-skeleton-cell" />
                </td>
                <td className="col-center">
                  <Skeleton width={68} height={26} className="member-scans-skeleton-chip" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mis-table-footer member-scans-pager skeleton-member-scans-pager">
        <Skeleton width={88} height={13} />
        <div className="mis-pager">
          <Skeleton width={76} height={32} />
          <Skeleton width={56} height={32} />
        </div>
      </div>
    </>
  );
}

export function SkeletonTableCard({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <SkeletonCard className="skeleton-table-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Skeleton width={160} height={20} />
        <Skeleton width={48} height={24} />
      </div>
      <div className="skeleton-table-head">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} width={`${70 + (index % 3) * 10}%`} height={12} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton key={colIndex} width={`${60 + ((rowIndex + colIndex) % 4) * 8}%`} height={12} />
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <Skeleton width={180} height={32} />
      </div>
    </SkeletonCard>
  );
}

export function SkeletonMentorSplitPage() {
  return (
    <div className="trainees-layout skeleton-mentor-split">
      <SkeletonCard className="trainees-sidebar-card">
        <Skeleton width="70%" height={18} style={{ marginBottom: 16 }} />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="skeleton-mentor-item">
            <Skeleton circle width={36} height={36} />
            <div style={{ flex: 1 }}>
              <Skeleton width={`${75 - index * 5}%`} height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="50%" height={11} />
            </div>
          </div>
        ))}
      </SkeletonCard>
      <SkeletonTableCard rows={8} columns={5} />
    </div>
  );
}

export function SkeletonDashboardBody() {
  return (
    <>
      <SkeletonKpiGrid count={4} columns={4} />
      <div className="home-lower skeleton-dashboard-lower">
        <SkeletonCard>
          <Skeleton width={140} height={18} style={{ marginBottom: 16 }} />
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="skeleton-notice-row">
              <Skeleton circle width={36} height={36} />
              <div style={{ flex: 1 }}>
                <Skeleton width={`${80 - index * 10}%`} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={11} style={{ marginBottom: 6 }} />
                <Skeleton width="65%" height={11} />
              </div>
            </div>
          ))}
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton width={160} height={18} style={{ marginBottom: 16 }} />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="skeleton-performer-row">
              <Skeleton width={24} height={14} />
              <Skeleton circle width={32} height={32} />
              <Skeleton width={`${70 - index * 6}%`} height={14} style={{ flex: 1 }} />
              <Skeleton width={48} height={14} />
            </div>
          ))}
        </SkeletonCard>
      </div>
    </>
  );
}

export function SkeletonProfileBody() {
  return (
    <div className="skeleton-profile-grid">
      {Array.from({ length: 3 }, (_, index) => (
        <SkeletonCard key={index}>
          <Skeleton width={140} height={18} style={{ marginBottom: 20 }} />
          <div className="skeleton-profile-fields">
            {Array.from({ length: 6 }, (_, fieldIndex) => (
              <div key={fieldIndex} className="skeleton-profile-field">
                <Skeleton width={96} height={11} style={{ marginBottom: 8 }} />
                <Skeleton width={`${55 + ((fieldIndex + index) % 3) * 12}%`} height={14} />
              </div>
            ))}
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

export function SkeletonCabPage() {
  return <SkeletonMentorSplitPage />;
}

export function SkeletonReportsStats() {
  return (
    <div className="reports-stats-grid skeleton-reports-stats">
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonCard key={index}>
          <Skeleton width={100} height={12} style={{ marginBottom: 12 }} />
          <Skeleton width="45%" height={28} />
        </SkeletonCard>
      ))}
    </div>
  );
}
