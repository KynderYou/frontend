import { useCallback, useEffect, useMemo, useState } from 'react';
import { debitCabRecord, getCabState, getMe } from '../../api';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../common/ToastProvider';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { cabCountFor, mapCabState, pendingCabCountFor } from './cabApiMapper';
import {
  formatAudioLabel,
  type CabDebitRecord,
  type CabDebitStatus,
} from './cabData';
import type { Mentor } from '../Trainees/traineesData';

const theme = colors.light;

type MisCabPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function statusStyles(status: CabDebitStatus) {
  if (status === 'Debited') return { color: theme.success, background: theme['success-bg'] };
  return { color: theme.warning, background: theme['warning-bg'] };
}

function CabDebitConfirmModal({
  open,
  record,
  onClose,
  onConfirm,
}: {
  open: boolean;
  record: CabDebitRecord | null;
  onClose: () => void;
  onConfirm: (record: CabDebitRecord) => void;
}) {
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

  if (!open || !record) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel reports-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cab-debit-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="cab-debit-title" className="modal-title">
              Debit mentee for CAB?
            </h2>
            <p className="modal-subtitle">
              Scan {record.scanId} · {record.menteeName}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p className="reports-delete-warning">
            This will debit <strong>{record.debitAmount}</strong> from {record.menteeName} for the counselling audio{' '}
            <strong>{record.audio.title}</strong> taken from {record.mentorName}.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-pill-primary"
            onClick={() => {
              onConfirm(record);
              onClose();
            }}
          >
            Confirm debit
          </button>
        </div>
      </div>
    </div>
  );
}

export function MisCabPage({ onOpenMobileMenu, onOpenProfile }: MisCabPageProps) {
  const { showSuccess, showError } = useToast();
  const [isAdmin, setIsAdmin] = useState(true);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [records, setRecords] = useState<CabDebitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [mentorQuery, setMentorQuery] = useState('');
  const [query, setQuery] = useState('');
  const [debitTarget, setDebitTarget] = useState<CabDebitRecord | null>(null);

  const loadState = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const member = await getMe(signal);
      const admin = member.role === 'Admin';
      setIsAdmin(admin);
      const state = await getCabState(signal, admin ? undefined : 'mine');
      const mapped = mapCabState(state);
      setMentors(mapped.mentors);
      setRecords(mapped.records);
      setSelectedMentorId((prev) => prev || mapped.mentors[0]?.id || '');
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load CAB entries.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadState(controller.signal);
    return () => controller.abort();
  }, [loadState]);

  const filteredMentors = useMemo(() => {
    const q = mentorQuery.trim().toLowerCase();
    const withCab = mentors.filter((m) => cabCountFor(m.id, records) > 0);
    if (!q) return withCab;
    return withCab.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q)
    );
  }, [mentorQuery, mentors, records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((row) => {
      if (isAdmin && row.mentorId !== selectedMentorId) return false;
      if (!isAdmin && row.mentorId !== mentors[0]?.id) return false;
      if (!q) return true;
      return (
        row.scanId.toLowerCase().includes(q) ||
        row.clientName.toLowerCase().includes(q) ||
        row.menteeName.toLowerCase().includes(q) ||
        row.audio.title.toLowerCase().includes(q) ||
        row.audio.fileName.toLowerCase().includes(q)
      );
    });
  }, [records, isAdmin, selectedMentorId, mentors, query]);

  const selectedMentor = mentors.find((m) => m.id === selectedMentorId);
  const pendingCount = filtered.filter((row) => row.status === 'Pending').length;

  const handleDebit = async (record: CabDebitRecord) => {
    try {
      const state = await debitCabRecord(Number(record.id));
      const mapped = mapCabState(state);
      setMentors(mapped.mentors);
      setRecords(mapped.records);
      showSuccess(`${record.debitAmount} debited from ${record.menteeName} for ${record.audio.title}.`);
    } catch {
      showError('Unable to record debit. Please try again.');
    }
  };

  if (loading) {
    return (
      <section className="page-section trainees-page mis-cab-page">
        <div className="page-header">
          <div className="page-title-block">
            <h1 className="page-title" style={{ margin: 0, color: theme['text-primary'] }}>
              MIS · CAB
            </h1>
          </div>
        </div>
        <p style={{ color: theme['text-muted'], fontSize: 14 }}>Loading CAB entries…</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page-section trainees-page mis-cab-page">
        <EmptyState title="Could not load CAB" description={loadError} />
        <button type="button" className="btn-pill-secondary" style={{ marginTop: spacing[3] }} onClick={() => loadState()}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="page-section trainees-page mis-cab-page">
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
            MIS · CAB
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            {isAdmin
              ? 'Debit trainees for counselling audio bytes taken from their mentor.'
              : 'Review mentee scans with CAB audio and record debits.'}
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

      <div className={`trainees-layout${isAdmin ? '' : ' trainees-layout--single'}`} style={{ gap: spacing[5] }}>
        {isAdmin ? (
          <div className="dash-card trainees-panel" style={{ padding: 0 }}>
            <div className="trainees-panel-header" style={{ padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${theme.divider}` }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>Mentors</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: theme['text-muted'] }}>
                {filteredMentors.length} with CAB entries
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
                  No mentors with CAB entries match your search.
                </p>
              ) : (
                filteredMentors.map((mentor) => {
                  const count = cabCountFor(mentor.id, records);
                  const pending = pendingCabCountFor(mentor.id, records);
                  const selected = mentor.id === selectedMentorId;
                  return (
                    <button
                      key={mentor.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setSelectedMentorId(mentor.id);
                        setQuery('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        padding: `${spacing[3]} ${spacing[5]}`,
                        border: 'none',
                        borderBottom: `1px solid ${theme.divider}`,
                        background: selected ? theme['primary-soft'] : theme['bg-surface'],
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        color: 'inherit',
                        borderLeft: selected ? `3px solid ${theme.primary}` : '3px solid transparent',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: selected ? theme.primary : theme['bg-muted'],
                          color: selected ? '#fff' : theme.primary,
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {initials(mentor.name)}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: theme['text-primary'], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {mentor.name}
                        </div>
                        <div style={{ fontSize: 11, color: theme['text-muted'], marginTop: 2 }}>{mentor.region}</div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: pending > 0 ? theme.warning : theme.primary,
                          background: pending > 0 ? theme['warning-bg'] : theme['primary-soft'],
                          borderRadius: radius.pill,
                          padding: '2px 8px',
                          flexShrink: 0,
                        }}
                      >
                        {pending > 0 ? `${pending} pending` : count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

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
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>
                {isAdmin ? `${selectedMentor?.name ?? 'Mentor'}'s mentee CAB scans` : 'Your mentee CAB scans'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>
                {filtered.length} audio{filtered.length === 1 ? '' : 's'} · {pendingCount} pending debit{pendingCount === 1 ? '' : 's'}
              </p>
            </div>

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
                placeholder="Search scans"
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

          <div className="trainees-table-body">
            <table className="mis-data-table trainees-data-table mis-cab-table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Name</th>
                  <th>Mentee</th>
                  <th>Audio File</th>
                  <th className="col-center">Debit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className="mis-data-empty">
                    <td colSpan={5}>No CAB audio entries for this selection.</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <CabRow key={row.id} row={row} onDebit={() => setDebitTarget(row)} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CabDebitConfirmModal
        open={Boolean(debitTarget)}
        record={debitTarget}
        onClose={() => setDebitTarget(null)}
        onConfirm={(record) => {
          void handleDebit(record);
        }}
      />
    </section>
  );
}

function CabRow({
  row,
  onDebit,
}: {
  row: CabDebitRecord;
  onDebit: () => void;
}) {
  const chip = statusStyles(row.status);
  const debited = row.status === 'Debited';

  return (
    <tr>
      <td data-label="Scan ID">
        <span className="mis-scan-id">{row.scanId}</span>
      </td>
      <td data-label="Name">{row.clientName}</td>
      <td data-label="Mentee">{row.menteeName}</td>
      <td data-label="Audio File">
        <div className="mis-cab-audio-cell">
          <span className="reports-cab-play mis-cab-audio-play" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <div className="mis-cab-audio-text">
            <span className="mis-cab-audio-title">{row.audio.title}</span>
            <span className="mis-cab-audio-meta">{formatAudioLabel(row.audio)} · {row.audio.fileName}</span>
          </div>
        </div>
      </td>
      <td data-label="Debit" className="col-center">
        {debited ? (
          <span className="trainees-status" style={{ color: chip.color, background: chip.background }}>
            Debited · {row.debitAmount}
          </span>
        ) : (
          <button type="button" className="scans-action-btn scans-action-export" onClick={onDebit}>
            Debit {row.debitAmount}
          </button>
        )}
      </td>
    </tr>
  );
}
