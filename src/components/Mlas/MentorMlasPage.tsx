import { useEffect, useMemo, useState } from 'react';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import {
  mentors,
  mlas,
  type Mla,
  type MlaStatus,
} from './mlasData';
import { scansForTrainee, type TraineeScan, type TraineeScanStatus } from '../Trainees/traineeScansData';

const theme = colors.light;

const CURRENT_MENTOR_ID = 'mentor-madhu';

type MentorMlasPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function mlaStatusStyles(status: MlaStatus) {
  if (status === 'Active') return { color: theme.success, background: theme['success-bg'] };
  return { color: theme['text-muted'], background: theme['bg-muted'] };
}

function scanStatusStyles(status: TraineeScanStatus) {
  if (status === 'Exported' || status === 'Verified') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Processing') return { color: theme.warning, background: theme['warning-bg'] };
  return { color: theme.primary, background: theme['primary-soft'] };
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export function MentorMlasPage({ onOpenMobileMenu, onOpenProfile }: MentorMlasPageProps) {
  const mentor = mentors.find((m) => m.id === CURRENT_MENTOR_ID);
  const myMlas = useMemo(() => mlas.filter((m) => m.mentorId === CURRENT_MENTOR_ID), []);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | MlaStatus>('All');
  const [selectedMla, setSelectedMla] = useState<Mla | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return myMlas.filter((m) => {
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [myMlas, query, statusFilter]);

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
            {mentor
              ? `${mentor.name} · view your MLAs and open a row to see their scans`
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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>Your MLAs</h2>
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

        <div className="trainees-table-body">
          <table className="mis-data-table trainees-data-table">
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
                filtered.map((m) => (
                  <MlaListRow key={m.id} mla={m} onOpen={() => setSelectedMla(m)} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MlaScansModal open={Boolean(selectedMla)} mla={selectedMla} onClose={() => setSelectedMla(null)} />
    </section>
  );
}

function MlaScansModal({ open, mla, onClose }: { open: boolean; mla: Mla | null; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open || !mla) return null;
  const mlaScans = scansForTrainee(mla.id);

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel trainee-scans-modal" role="dialog" aria-modal="true" aria-labelledby="mla-list-scans-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="mla-list-scans-title" className="modal-title">{mla.name}&apos;s scans</h2>
            <p className="modal-subtitle">{mla.email} · {mlaScans.length} scan{mlaScans.length === 1 ? '' : 's'}</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="modal-body trainee-scans-modal-body">
          <div className="scans-table-wrap">
            <table className="scans-table">
              <thead>
                <tr>
                  <th>Sno</th><th>Scan Id</th><th>Name</th><th>Gender</th><th>Report Type</th><th>Cost</th><th>Uploaded</th><th className="col-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {mlaScans.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: theme['text-muted'], padding: '28px 12px' }}>No scans uploaded by this MLA yet.</td></tr>
                ) : mlaScans.map((scan, i) => <MlaScanRow key={scan.id} scan={scan} index={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MlaListRow({ mla, onOpen }: { mla: Mla; onOpen: () => void }) {
  const tone = mlaStatusStyles(mla.status);
  return (
    <tr
      className="mentor-trainee-row"
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      tabIndex={0}
      role="button"
      aria-label={`View scans for ${mla.name}`}
      style={{ cursor: 'pointer' }}
    >
      <td data-label="MLA">
        <div className="trainees-person">
          <span className="trainees-avatar" aria-hidden="true">{initials(mla.name)}</span>
          <div>
            <div className="trainees-person-name">{mla.name}</div>
            <div className="trainees-person-email">{mla.email}</div>
          </div>
        </div>
      </td>
      <td data-label="DOJ">{mla.doj}</td>
      <td data-label="Billing %" className="col-center">{mla.billingPercent}%</td>
      <td data-label="Number of scans" className="col-center">{mla.scanCount}</td>
      <td data-label="DOEx">{mla.doex}</td>
      <td data-label="Status" className="col-center">
        <span className="trainees-status" style={{ color: tone.color, background: tone.background }}>{mla.status}</span>
      </td>
    </tr>
  );
}

function MlaScanRow({ scan, index }: { scan: TraineeScan; index: number }) {
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
      <td data-label="Status"><span className="scans-status-chip" style={chip}>{scan.status}</span></td>
    </tr>
  );
}
