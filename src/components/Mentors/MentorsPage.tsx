import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMentors, getMentorScans } from '../../api';
import type { MentorRowApi } from '../../api/types';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { LastScanCell } from '../common/LastScanCell';
import { MemberScansModal } from '../common/MemberScansModal';
import { SkeletonTableCard } from '../common/Skeleton';
import { TablePager } from '../common/TablePager';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { mapMlaScans } from '../Mlas/mlasApiMapper';
import type { MlaScan, MlaScanStatus } from '../Mlas/mlasData';
import { initials } from '../../utils/initials';

const theme = colors.light;
const PAGE_SIZE = 10;

type MentorStatusFilter = 'All' | 'Active' | 'Inactive';

type MentorsPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};


function statusStyles(status: string) {
  if (status === 'Active') return { color: theme.success, background: theme['success-bg'] };
  return { color: theme['text-muted'], background: theme['bg-muted'] };
}

function scanStatusStyles(status: MlaScanStatus) {
  if (status === 'Exported' || status === 'Verified') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Processing') return { color: theme.warning, background: theme['warning-bg'] };
  return { color: theme.primary, background: theme['primary-soft'] };
}

export function MentorsPage({ onOpenMobileMenu, onOpenProfile }: MentorsPageProps) {
  const [mentors, setMentors] = useState<MentorRowApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MentorStatusFilter>('All');
  const [scansMentor, setScansMentor] = useState<MentorRowApi | null>(null);

  const loadMentors = useCallback(async (signal?: AbortSignal) => {
    try {
      setMentors(await getMentors(signal));
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load mentors.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadMentors(controller.signal);
    return () => controller.abort();
  }, [loadMentors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mentors.filter((m) => {
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [mentors, query, statusFilter]);

  const pagination = useClientPagination(filtered, PAGE_SIZE, `${query}|${statusFilter}`);

  return (
    <section className="page-section trainees-page">
      <div className="page-header">
        <div className="page-title-block" style={{ minWidth: 0, flex: 1 }}>
          <h1
            className="page-title"
            style={{
              margin: 0,
              fontSize: typography.roles.pageTitle.fontSize,
              lineHeight: typography.roles.pageTitle.lineHeight,
              fontWeight: typography.roles.pageTitle.fontWeight,
              letterSpacing: typography.roles.pageTitle.letterSpacing,
              color: theme['text-primary'],
            }}
          >
            My Mentors
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            All mentors. Scan figures count only scans each mentor uploaded themselves.
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <NotificationButton />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      {loading ? (
        <SkeletonTableCard />
      ) : loadError ? (
        <EmptyState title={loadError} description="Check your connection and try again." />
      ) : mentors.length === 0 ? (
        <EmptyState title="No mentors yet" description="Create mentor accounts from Member Accounts." />
      ) : (
        <div className="dash-card trainees-table-panel" style={{ padding: 0, minWidth: 0, width: '100%' }}>
          <div
            className="trainees-table-toolbar"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing[4],
              padding: `${spacing[5]} ${spacing[6]}`,
              borderBottom: `1px solid ${theme.divider}`,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>Mentors</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>
                {filtered.length} result{filtered.length === 1 ? '' : 's'}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: theme['bg-muted'],
                  borderRadius: radius.md,
                  padding: '8px 12px',
                  minWidth: 180,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme['text-muted']} strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search mentors"
                  aria-label="Search mentors"
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 13,
                    color: theme['text-primary'],
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                />
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MentorStatusFilter)}
                aria-label="Filter by status"
                style={{
                  height: 36,
                  borderRadius: radius.md,
                  border: `1px solid ${theme.divider}`,
                  background: theme['bg-surface'],
                  color: theme['text-primary'],
                  fontSize: 13,
                  padding: '0 12px',
                  fontFamily: 'inherit',
                }}
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="trainees-table-body">
            <table className="mis-data-table mlas-data-table">
              <thead>
                <tr>
                  <th>Mentor</th>
                  <th>DOJ</th>
                  <th className="col-center">Billing %</th>
                  <th className="col-center">Number of scans</th>
                  <th>Last scan</th>
                  <th>DOEx</th>
                  <th className="col-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.length === 0 ? (
                  <tr className="mis-data-empty">
                    <td colSpan={7}>No mentors match your search.</td>
                  </tr>
                ) : (
                  pagination.pageItems.map((mentor) => (
                    <MentorRow key={mentor.id} mentor={mentor} onOpen={() => setScansMentor(mentor)} />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePager
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={pagination.setPage}
            className="mis-table-footer"
          />
        </div>
      )}

      <MentorScansModal mentor={scansMentor} onClose={() => setScansMentor(null)} />
    </section>
  );
}

function MentorRow({ mentor, onOpen }: { mentor: MentorRowApi; onOpen: () => void }) {
  const tone = statusStyles(mentor.status);
  return (
    <tr
      className="mentor-mla-row"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View scans uploaded by ${mentor.name}`}
      style={{ cursor: 'pointer' }}
    >
      <td data-label="Mentor">
        <div className="trainees-person">
          <span className="trainees-avatar" aria-hidden="true">
            {initials(mentor.name)}
          </span>
          <div>
            <div className="trainees-person-name">{mentor.name}</div>
            <div className="trainees-person-email">
              {mentor.email} · {mentor.trainee_count} trainee{mentor.trainee_count === 1 ? '' : 's'} · {mentor.mla_count} MLA
              {mentor.mla_count === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </td>
      <td data-label="DOJ">{mentor.doj}</td>
      <td data-label="Billing %" className="col-center">
        {mentor.billing_percent}%
      </td>
      <td data-label="Number of scans" className="col-center">
        {mentor.scan_count}
      </td>
      <td data-label="Last scan">
        <LastScanCell date={mentor.last_scan} days={mentor.last_scan_days} />
      </td>
      <td data-label="DOEx">{mentor.doex}</td>
      <td data-label="Status" className="col-center">
        <span className="mlas-status" style={{ color: tone.color, background: tone.background }}>
          {mentor.status}
        </span>
      </td>
    </tr>
  );
}

function MentorScansModal({ mentor, onClose }: { mentor: MentorRowApi | null; onClose: () => void }) {
  const [scans, setScans] = useState<MlaScan[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    if (!mentor) return;
    const controller = new AbortController();
    getMentorScans(mentor.id, controller.signal)
      .then((rows) => {
        setScans(mapMlaScans(rows));
        setScanError('');
      })
      .catch(() => {
        if (!controller.signal.aborted) setScanError('Unable to load scans.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingScans(false);
      });
    return () => {
      controller.abort();
      setScans([]);
      setLoadingScans(true);
    };
  }, [mentor]);

  return (
    <MemberScansModal
      open={Boolean(mentor)}
      onClose={onClose}
      titleId="mentor-scans-title"
      memberName={mentor?.name ?? ''}
      memberEmail={mentor?.email ?? ''}
      scanCount={mentor?.scan_count ?? 0}
      scans={scans}
      loading={loadingScans}
      error={scanError}
      emptyMessage="This mentor hasn't uploaded any scans themselves yet."
      statusStyle={(status) => scanStatusStyles(status as MlaScanStatus)}
    />
  );
}
