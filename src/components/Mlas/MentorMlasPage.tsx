import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMe, getMlaScans, getMlasState } from '../../api';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { mapMlaScans, mapMlasState } from './mlasApiMapper';
import type { Mla, MlaScan, MlaScanStatus, MlaStatus } from './mlasData';

const theme = colors.light;

type MentorMlasPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function mlaStatusStyles(status: MlaStatus) {
  if (status === 'Active') return { color: theme.success, background: theme['success-bg'] };
  return { color: theme['text-muted'], background: theme['bg-muted'] };
}

function scanStatusStyles(status: MlaScanStatus) {
  if (status === 'Exported' || status === 'Verified') {
    return { color: theme.success, background: theme['success-bg'] };
  }
  if (status === 'Processing') {
    return { color: theme.warning, background: theme['warning-bg'] };
  }
  return { color: theme.primary, background: theme['primary-soft'] };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function MentorMlasPage({ onOpenMobileMenu, onOpenProfile }: MentorMlasPageProps) {
  const [mentorName, setMentorName] = useState('');
  const [mlas, setMlas] = useState<Mla[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | MlaStatus>('All');
  const [selectedMla, setSelectedMla] = useState<Mla | null>(null);

  const loadState = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [member, state] = await Promise.all([getMe(signal), getMlasState(signal, 'mine')]);
      const mapped = mapMlasState(state);
      setMentorName(member.name || mapped.mentors[0]?.name || '');
      setMlas(mapped.mlas);
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load MLAs.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadState(controller.signal);
    return () => controller.abort();
  }, [loadState]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mlas.filter((mla) => {
      if (statusFilter !== 'All' && mla.status !== statusFilter) return false;
      if (!q) return true;
      return (
        mla.name.toLowerCase().includes(q) ||
        mla.email.toLowerCase().includes(q)
      );
    });
  }, [mlas, query, statusFilter]);

  if (loading) {
    return (
      <section className="page-section">
        <div className="page-header">
          <div className="page-title-block">
            <h1 className="page-title" style={{ margin: 0, color: theme['text-primary'] }}>
              MLA List
            </h1>
          </div>
        </div>
        <p style={{ color: theme['text-muted'], fontSize: 14 }}>Loading MLAs…</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page-section">
        <div className="page-header">
          <div className="page-title-block">
            <h1 className="page-title" style={{ margin: 0, color: theme['text-primary'] }}>
              MLA List
            </h1>
          </div>
        </div>
        <EmptyState title={loadError} description="Check your connection and try again." />
      </section>
    );
  }

  return (
    <section className="page-section">
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
            MLA List
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            {mentorName
              ? `${mentorName} · view your MLAs and open a row to see their scans`
              : 'View your MLAs and open a row to see their scans'}
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

      <div className="dash-card mlas-table-panel" style={{ padding: 0, minWidth: 0, width: '100%' }}>
        <div
          className="mlas-table-toolbar"
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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>
              Your MLAs
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>
              {filtered.length} result{filtered.length === 1 ? '' : 's'} · click a row to view scans
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
                placeholder="Search MLAs"
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
              onChange={(e) => setStatusFilter(e.target.value as 'All' | MlaStatus)}
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

        <div className="mlas-table-body">
          <table className="mis-data-table mlas-data-table">
            <thead>
              <tr>
                <th>MLA</th>
                <th>DOJ</th>
                <th className="col-center">Billing %</th>
                <th className="col-center">Number of scans</th>
                <th>DOEx</th>
                <th className="col-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr className="mis-data-empty">
                  <td colSpan={6}>No MLAs found.</td>
                </tr>
              ) : (
                filtered.map((mla) => (
                  <MlaListRow
                    key={mla.id}
                    mla={mla}
                    onOpen={() => setSelectedMla(mla)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MlaScansModal
        open={Boolean(selectedMla)}
        mla={selectedMla}
        onClose={() => setSelectedMla(null)}
      />
    </section>
  );
}

function MlaScansModal({
  open,
  mla,
  onClose,
}: {
  open: boolean;
  mla: Mla | null;
  onClose: () => void;
}) {
  const [scans, setScans] = useState<MlaScan[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !mla) {
      setScans([]);
      setScanError('');
      return;
    }
    const controller = new AbortController();
    setLoadingScans(true);
    getMlaScans(Number(mla.id), controller.signal)
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
    return () => controller.abort();
  }, [open, mla]);

  if (!open || !mla) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel mla-scans-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mla-scans-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="mla-scans-title" className="modal-title">
              {mla.name}&apos;s scans
            </h2>
            <p className="modal-subtitle">
              {mla.email} · {mla.scanCount} scan{mla.scanCount === 1 ? '' : 's'}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body mla-scans-modal-body">
          {loadingScans ? (
            <p style={{ textAlign: 'center', color: theme['text-muted'], padding: '28px 12px' }}>Loading scans…</p>
          ) : scanError ? (
            <p style={{ textAlign: 'center', color: theme['text-muted'], padding: '28px 12px' }}>{scanError}</p>
          ) : (
            <div className="scans-table-wrap">
              <table className="scans-table">
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
                  {scans.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: theme['text-muted'], padding: '28px 12px' }}>
                        No scans uploaded by this MLA yet.
                      </td>
                    </tr>
                  ) : (
                    scans.map((scan, index) => <MlaScanRow key={scan.id} scan={scan} index={index} />)
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MlaListRow({ mla, onOpen }: { mla: Mla; onOpen: () => void }) {
  const tone = mlaStatusStyles(mla.status);
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
      aria-label={`View scans for ${mla.name}`}
      style={{ cursor: 'pointer' }}
    >
      <td data-label="MLA">
        <div className="mlas-person">
          <span className="mlas-avatar" aria-hidden="true">
            {initials(mla.name)}
          </span>
          <div>
            <div className="mlas-person-name">{mla.name}</div>
            <div className="mlas-person-email">{mla.email}</div>
          </div>
        </div>
      </td>
      <td data-label="DOJ">{mla.doj}</td>
      <td data-label="Billing %" className="col-center">
        {mla.billingPercent}%
      </td>
      <td data-label="Number of scans" className="col-center">
        {mla.scanCount}
      </td>
      <td data-label="DOEx">{mla.doex}</td>
      <td data-label="Status" className="col-center">
        <span className="mlas-status" style={{ color: tone.color, background: tone.background }}>
          {mla.status}
        </span>
      </td>
    </tr>
  );
}

function MlaScanRow({ scan, index }: { scan: MlaScan; index: number }) {
  const chip = scanStatusStyles(scan.status);
  return (
    <tr>
      <td data-label="Sno">{index + 1}</td>
      <td data-label="Scan Id">{scan.scanId}</td>
      <td data-label="Name">{scan.clientName}</td>
      <td data-label="Gender">{scan.gender}</td>
      <td data-label="Report Type">{scan.reportType}</td>
      <td data-label="Cost">{scan.cost}</td>
      <td data-label="Uploaded">{scan.uploadedAt}</td>
      <td data-label="Status">
        <span className="scans-status-chip" style={chip}>
          {scan.status}
        </span>
      </td>
    </tr>
  );
}
