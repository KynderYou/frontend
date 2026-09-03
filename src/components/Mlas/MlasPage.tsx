import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMlaScans, getMlasState } from '../../api';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { MemberScansModal } from '../common/MemberScansModal';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { mapMlaScans, mapMlasState, mlaCountFor } from './mlasApiMapper';
import { type Mentor, type Mla, type MlaScan, type MlaScanStatus, type MlaStatus } from './mlasData';

const theme = colors.light;
const PAGE_SIZE = 5;

type MlasPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function statusStyles(status: MlaStatus) {
  if (status === 'Active') return { color: theme.success, background: theme['success-bg'] };
  return { color: theme['text-muted'], background: theme['bg-muted'] };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function MlasPage({ onOpenMobileMenu, onOpenProfile }: MlasPageProps) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mlas, setMlas] = useState<Mla[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [mentorQuery, setMentorQuery] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | MlaStatus>('All');
  const [page, setPage] = useState(1);
  const [scansMla, setScansMla] = useState<Mla | null>(null);

  const loadState = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const state = await getMlasState(signal);
      const mapped = mapMlasState(state);
      setMentors(mapped.mentors);
      setMlas(mapped.mlas);
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load mlas.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadState(controller.signal);
    return () => controller.abort();
  }, [loadState]);

  useEffect(() => {
    if (mentors.length === 0) {
      setSelectedMentorId('');
      return;
    }
    if (!selectedMentorId || !mentors.some((mentor) => mentor.id === selectedMentorId)) {
      setSelectedMentorId(mentors[0].id);
    }
  }, [mentors, selectedMentorId]);

  const selectedMentor: Mentor | undefined = mentors.find((m) => m.id === selectedMentorId);

  const filteredMentors = useMemo(() => {
    const q = mentorQuery.trim().toLowerCase();
    if (!q) return mentors;
    return mentors.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    );
  }, [mentorQuery, mentors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mlas.filter((t) => {
      if (t.mentorId !== selectedMentorId) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q)
      );
    });
  }, [selectedMentorId, query, statusFilter, mlas]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectMentor = (id: string) => {
    setSelectedMentorId(id);
    setPage(1);
    setQuery('');
    setStatusFilter('All');
  };

  if (loading) {
    return (
      <section className="page-section trainees-page">
        <div className="page-header">
          <div className="page-title-block">
            <h1 className="page-title" style={{ margin: 0, color: theme['text-primary'] }}>
              My Mlas
            </h1>
          </div>
        </div>
        <p style={{ color: theme['text-muted'], fontSize: 14 }}>Loading mlas…</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page-section trainees-page">
        <div className="page-header">
          <div className="page-title-block">
            <h1 className="page-title" style={{ margin: 0, color: theme['text-primary'] }}>
              My Mlas
            </h1>
          </div>
        </div>
        <EmptyState title={loadError} description="Check your connection and try again." />
      </section>
    );
  }

  if (mentors.length === 0) {
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
              My Mlas
            </h1>
          </div>
          <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationButton />
            <ProfileAvatarButton onClick={onOpenProfile} />
          </div>
        </div>
        <EmptyState title="No mentors with mlas yet" description="When members mentor mlas, they will appear here." />
      </section>
    );
  }

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
            My Mlas
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Trainees promoted to MLA after one year — still linked to their mentors.
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <button type="button" className="btn-pill-primary" style={{ height: 36, fontSize: 13, padding: '8px 14px' }}>
            + Promote trainee
          </button>
          <NotificationButton />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      <div className="trainees-layout" style={{ gap: spacing[5] }}>
        <div className="dash-card trainees-panel" style={{ padding: 0 }}>
          <div className="trainees-panel-header" style={{ padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${theme.divider}` }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>Mentors</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: theme['text-muted'] }}>
              {filteredMentors.length} of {mentors.length}
            </p>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: theme['bg-muted'],
                borderRadius: radius.md,
                padding: '8px 12px',
                marginTop: spacing[3],
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme['text-muted']} strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={mentorQuery}
                onChange={(e) => setMentorQuery(e.target.value)}
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
          </div>

          <div role="listbox" aria-label="Mentors" className="trainees-panel-scroll">
            {filteredMentors.length === 0 ? (
              <p style={{ padding: spacing[5], margin: 0, fontSize: 13, color: theme['text-muted'], textAlign: 'center' }}>
                No mentors match your search.
              </p>
            ) : (
              filteredMentors.map((mentor) => {
                const count = mentor.traineeCount ?? mlaCountFor(mentor.id, mlas);
                const selected = mentor.id === selectedMentorId;
                return (
                  <button
                    key={mentor.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`mentor-picker-row${selected ? ' is-selected' : ''}`}
                    onClick={() => selectMentor(mentor.id)}
                  >
                    <span className="mentor-picker-avatar" aria-hidden="true">
                      {initials(mentor.name)}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: theme['text-primary'],
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {mentor.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: theme['text-muted'],
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {mentor.region}
                      </div>
                    </div>
                    <span className="mentor-picker-count">
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="dash-card trainees-table-panel" style={{ padding: 0, minWidth: 0 }}>
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
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>
                {selectedMentor ? `${selectedMentor.name}'s MLAs` : 'MLAs'}
              </h2>
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
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search mlas"
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
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'All' | MlaStatus);
                  setPage(1);
                }}
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
                  <th>MLA</th>
                  <th>DOJ</th>
                  <th className="col-center">Billing %</th>
                  <th className="col-center">Number of scans</th>
                  <th>DOEx</th>
                  <th className="col-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr className="mis-data-empty">
                    <td colSpan={6}>No mlas for this mentor.</td>
                  </tr>
                ) : (
                  pageRows.map((row) => <MlaRow key={row.id} mla={row} onOpen={() => setScansMla(row)} />)
                )}
              </tbody>
            </table>
          </div>

          <div
            className="trainees-table-footer"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: `${spacing[4]} ${spacing[6]}`,
              borderTop: `1px solid ${theme.divider}`,
              fontSize: 13,
              color: theme['text-secondary'],
            }}
          >
            <span>
              {filtered.length === 0
                ? '0 mlas'
                : `${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn-pill-secondary"
                style={{ height: 32, fontSize: 12, padding: '6px 12px' }}
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-pill-secondary"
                style={{ height: 32, fontSize: 12, padding: '6px 12px' }}
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <MlaScansModal open={Boolean(scansMla)} mla={scansMla} onClose={() => setScansMla(null)} />
    </section>
  );
}

function scanStatusStyles(status: MlaScanStatus) {
  if (status === 'Exported' || status === 'Verified') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Processing') return { color: theme.warning, background: theme['warning-bg'] };
  return { color: theme.primary, background: theme['primary-soft'] };
}

function MlaScansModal({ open, mla, onClose }: { open: boolean; mla: Mla | null; onClose: () => void }) {
  const [scans, setScans] = useState<MlaScan[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [scanError, setScanError] = useState('');

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

  return (
    <MemberScansModal
      open={open && Boolean(mla)}
      onClose={onClose}
      titleId="mla-scans-title"
      memberName={mla?.name ?? ''}
      memberEmail={mla?.email ?? ''}
      scanCount={mla?.scanCount ?? 0}
      scans={scans}
      loading={loadingScans}
      error={scanError}
      emptyMessage="No scans uploaded by this MLA yet."
      statusStyle={(status) => scanStatusStyles(status as MlaScanStatus)}
    />
  );
}

function MlaRow({ mla, onOpen }: { mla: Mla; onOpen: () => void }) {
  const tone = statusStyles(mla.status);
  return (
    <tr
      className="mentor-mla-row"
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      tabIndex={0}
      role="button"
      aria-label={`View scans for ${mla.name}`}
      style={{ cursor: 'pointer' }}
    >
      <td data-label="MLA">
        <div className="trainees-person">
          <span className="trainees-avatar" aria-hidden="true">
            {initials(mla.name)}
          </span>
          <div>
            <div className="trainees-person-name">{mla.name}</div>
            <div className="trainees-person-email">{mla.email}</div>
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
        <span
          className="mlas-status"
          style={{
            color: tone.color,
            background: tone.background,
          }}
        >
          {mla.status}
        </span>
      </td>
    </tr>
  );
}
