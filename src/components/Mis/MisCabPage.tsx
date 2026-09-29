import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, debitCabRecord, deleteCabRecord, deleteCabRequest, getCabState, getMe, reviewCabUpload } from '../../api';
import type { CabStateApi } from '../../api/types';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { SkeletonCabPage } from '../common/Skeleton';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { CabPlayButton } from '../Reports/CabPlayButton';
import { mapCabState } from './cabApiMapper';
import {
  buildCabEntries,
  type CabDebitRecord,
  type CabDebitStatus,
  type CabEntry,
  type CabPendingRequest,
  type CabUpload,
} from './cabData';
import { MisCabUploadModal } from './MisCabUploadModal';

const theme = colors.light;
const CAB_PAGE_SIZE = 12;

type MisCabPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  /** Open upload modal for this scan (notification deep link). */
  initialScanCode?: string | null;
  onClearInitialScan?: () => void;
};

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

export function MisCabPage({
  onOpenMobileMenu,
  onOpenProfile,
  initialScanCode = null,
  onClearInitialScan,
}: MisCabPageProps) {
  const { showSuccess, showError } = useToast();
  const [isAdmin, setIsAdmin] = useState(true);
  const [isTrainee, setIsTrainee] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [records, setRecords] = useState<CabDebitRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CabPendingRequest[]>([]);
  const [uploads, setUploads] = useState<CabUpload[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [debitTarget, setDebitTarget] = useState<CabDebitRecord | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{ scanCode: string; clientName?: string } | null>(null);

  const applyState = useCallback((state: CabStateApi) => {
    const mapped = mapCabState(state);
    setRecords(mapped.records);
    setPendingRequests(mapped.pendingRequests);
    setUploads(mapped.uploads);
  }, []);

  const loadState = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const member = await getMe(signal);
      const staffView = member.role === 'Admin';
      const mentorView = member.role === 'Mentor';
      setIsAdmin(staffView);
      setIsTrainee(member.role === 'Trainee');
      setCanUpload(staffView || mentorView);
      const scope = staffView ? undefined : mentorView ? 'mine' : undefined;
      applyState(await getCabState(signal, scope));
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load CAB entries.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [applyState]);

  useEffect(() => {
    const controller = new AbortController();
    loadState(controller.signal);
    return () => controller.abort();
  }, [loadState]);

  useEffect(() => {
    if (!initialScanCode || !canUpload || loading) return;
    const pending = pendingRequests.find((row) => row.scanCode === initialScanCode);
    setUploadTarget({
      scanCode: initialScanCode,
      clientName: pending?.clientName,
    });
    onClearInitialScan?.();
  }, [initialScanCode, canUpload, loading, pendingRequests, onClearInitialScan]);

  const entries = useMemo(() => buildCabEntries(uploads, records), [uploads, records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (row) =>
        row.scanCode.toLowerCase().includes(q) ||
        row.clientName.toLowerCase().includes(q) ||
        row.menteeName.toLowerCase().includes(q) ||
        row.mentorName.toLowerCase().includes(q) ||
        row.audio.title.toLowerCase().includes(q) ||
        row.audio.fileName.toLowerCase().includes(q)
    );
  }, [entries, query]);

  const cabPagination = useClientPagination(filtered, CAB_PAGE_SIZE, query);

  const pendingApprovals = entries.filter((row) => row.upload?.approvalStatus === 'Pending').length;
  const pendingDebits = entries.filter((row) => row.debit?.status === 'Pending').length;

  const runCabAction = async (action: () => Promise<CabStateApi>, success: string, failure: string) => {
    if (busy) return;
    setBusy(true);
    try {
      applyState(await action());
      showSuccess(success);
    } catch (err) {
      const detail = err instanceof ApiError ? (err.body as { detail?: unknown } | null)?.detail : null;
      showError(typeof detail === 'string' ? detail : failure);
    } finally {
      setBusy(false);
    }
  };

  const handleDebit = (record: CabDebitRecord) =>
    runCabAction(
      () => debitCabRecord(Number(record.id)),
      `${record.debitAmount} debited from ${record.menteeName} for ${record.audio.title}.`,
      'Unable to record debit. Please try again.',
    );

  const handleDeleteRecord = (record: CabDebitRecord) => {
    if (!window.confirm(`Delete the ${record.debitAmount} CAB debit for ${record.menteeName}? They will not be charged.`)) return;
    void runCabAction(
      () => deleteCabRecord(Number(record.id)),
      `CAB debit for ${record.scanId} deleted.`,
      'Unable to delete CAB debit.',
    );
  };

  const handleDeleteRequest = (row: CabPendingRequest) => {
    if (!window.confirm(`Delete the CAB request for ${row.scanCode} (${row.clientName || row.menteeName})?`)) return;
    void runCabAction(
      () => deleteCabRequest(row.scanCode),
      `CAB request for ${row.scanCode} deleted.`,
      'Unable to delete CAB request.',
    );
  };

  const handleReview = (upload: CabUpload, approve: boolean) =>
    runCabAction(
      () => reviewCabUpload(Number(upload.id), approve),
      approve
        ? `CAB approved · ${upload.creditAmount} credited to ${upload.mentorName}.`
        : `CAB for ${upload.scanCode} rejected.`,
      'Unable to update CAB approval.',
    );

  const openUpload = (row: CabPendingRequest) => {
    setUploadTarget({ scanCode: row.scanCode, clientName: row.clientName });
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
        <SkeletonCabPage />
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

  const summary = isTrainee
    ? `${filtered.length} audio${filtered.length === 1 ? '' : 's'}`
    : `${filtered.length} audio${filtered.length === 1 ? '' : 's'} · ${pendingApprovals} awaiting approval · ${pendingDebits} pending debit${pendingDebits === 1 ? '' : 's'}`;

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
            {isTrainee
              ? 'Counselling audio uploaded for your scans.'
              : isAdmin
                ? 'Upload CAB for pending requests, approve uploads to credit mentors, and debit mentees.'
                : 'Upload counselling audio for mentee CAB requests, then record debits.'}
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

      {canUpload && pendingRequests.length > 0 ? (
        <div className="dash-card" style={{ padding: 0, marginBottom: spacing[5] }}>
          <div style={{ padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${theme.divider}` }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: theme['text-primary'] }}>
              Pending CAB uploads
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>
              {pendingRequests.length} request{pendingRequests.length === 1 ? '' : 's'} waiting for counselling audio
            </p>
          </div>
          <div className="trainees-table-body">
            <table className="mis-data-table trainees-data-table mis-cab-table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Client</th>
                  <th>Mentee</th>
                  <th>Requested</th>
                  <th className="col-center">Charge</th>
                  <th className="col-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((row) => (
                  <tr key={row.scanCode}>
                    <td data-label="Scan ID">
                      <span className="mis-scan-id">{row.scanCode}</span>
                    </td>
                    <td data-label="Client">{row.clientName || '—'}</td>
                    <td data-label="Mentee">{row.menteeName}</td>
                    <td data-label="Requested">{row.requestedAt || '—'}</td>
                    <td data-label="Charge" className="col-center">
                      {row.flaggedX ? (
                        <span className="process-scan-flag-chip" title="CAB is free for the associate on Flag X scans">
                          Free · Flag X
                        </span>
                      ) : (
                        <span className="trainees-status" style={statusStyles('Pending')}>
                          Debit after upload
                        </span>
                      )}
                    </td>
                    <td data-label="Action" className="col-center">
                      <div className="mis-cab-actions">
                        <button
                          type="button"
                          className="scans-action-btn scans-action-export"
                          disabled={busy}
                          onClick={() => openUpload(row)}
                        >
                          Upload CAB
                        </button>
                        <button
                          type="button"
                          className="scans-action-btn scans-action-danger"
                          disabled={busy}
                          onClick={() => handleDeleteRequest(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {entries.length === 0 && pendingRequests.length === 0 ? (
        <div className="dash-card" style={{ padding: spacing[2] }}>
          <EmptyState
            title="No CAB entries yet"
            description={
              isTrainee
                ? 'When counselling audio is uploaded for your scans, it will appear here.'
                : isAdmin
                  ? 'When a mentee requests CAB, pending uploads appear here for mentors to complete.'
                  : 'When your mentees request CAB, upload counselling audio here. Debit entries appear after upload.'
            }
          />
        </div>
      ) : entries.length === 0 ? null : (
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
                {isTrainee ? 'Your CAB audio' : 'CAB uploads'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>{summary}</p>
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
                aria-label="Search CAB uploads"
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
                  <th>Client</th>
                  {isAdmin ? <th>Mentor</th> : null}
                  {isTrainee ? <th>Mentor</th> : <th>Mentee</th>}
                  <th>Audio File</th>
                  {!isTrainee ? <th className="col-center">Mentor credit</th> : null}
                  <th className="col-center">{isTrainee ? 'Charge' : 'Mentee debit'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className="mis-data-empty">
                    <td colSpan={7}>No CAB uploads match your search.</td>
                  </tr>
                ) : (
                  cabPagination.pageItems.map((row) => (
                    <CabEntryRow
                      key={row.key}
                      row={row}
                      isAdmin={isAdmin}
                      isTrainee={isTrainee}
                      busy={busy}
                      onReview={(approve) => row.upload && void handleReview(row.upload, approve)}
                      onDebit={() => row.debit && setDebitTarget(row.debit)}
                      onDeleteDebit={() => row.debit && handleDeleteRecord(row.debit)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePager
            page={cabPagination.page}
            pageSize={cabPagination.pageSize}
            total={cabPagination.total}
            onPageChange={cabPagination.setPage}
            className="mis-table-footer"
          />
        </div>
      )}

      <CabDebitConfirmModal
        open={Boolean(debitTarget)}
        record={debitTarget}
        onClose={() => setDebitTarget(null)}
        onConfirm={(record) => {
          void handleDebit(record);
        }}
      />

      <MisCabUploadModal
        open={Boolean(uploadTarget)}
        scanCode={uploadTarget?.scanCode ?? ''}
        clientName={uploadTarget?.clientName}
        onClose={() => setUploadTarget(null)}
        onUploaded={() => {
          void loadState();
        }}
      />
    </section>
  );
}

function approvalStyles(status: CabUpload['approvalStatus']) {
  if (status === 'Approved') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Rejected') return { color: theme.error, background: theme['error-bg'] };
  return { color: theme.warning, background: theme['warning-bg'] };
}

function approvalLabel(upload: CabUpload) {
  if (upload.approvalStatus === 'Approved') return upload.creditAmount ? `Credited · ${upload.creditAmount}` : 'Approved · no credit';
  if (upload.approvalStatus === 'Rejected') return 'Rejected · no credit';
  return `Awaiting approval · ${upload.creditAmount}`;
}

const mutedChip = { color: theme['text-muted'], background: theme['bg-muted'] };

function CabEntryRow({
  row,
  isAdmin,
  isTrainee,
  busy,
  onReview,
  onDebit,
  onDeleteDebit,
}: {
  row: CabEntry;
  isAdmin: boolean;
  isTrainee: boolean;
  busy: boolean;
  onReview: (approve: boolean) => void;
  onDebit: () => void;
  onDeleteDebit: () => void;
}) {
  const { upload, debit } = row;
  const debited = debit?.status === 'Debited';

  let debitCell;
  if (row.flaggedX) {
    debitCell = (
      <span className="process-scan-flag-chip" title="CAB is free for the associate on Flag X scans">
        Free · Flag X
      </span>
    );
  } else if (debit) {
    debitCell = (
      <>
        <span className="trainees-status" style={statusStyles(debit.status)}>
          {debited ? `Debited · ${debit.debitAmount}` : isTrainee ? 'Available' : `Pending · ${debit.debitAmount}`}
        </span>
        {!isTrainee && !debited ? (
          <div className="mis-cab-actions" style={{ marginTop: 6 }}>
            <button type="button" className="scans-action-btn scans-action-export" disabled={busy} onClick={onDebit}>
              Debit {debit.debitAmount}
            </button>
            <button type="button" className="scans-action-btn scans-action-danger" disabled={busy} onClick={onDeleteDebit}>
              Delete
            </button>
          </div>
        ) : null}
      </>
    );
  } else {
    debitCell = (
      <span className="trainees-status" style={mutedChip}>
        Waived
      </span>
    );
  }

  return (
    <tr>
      <td data-label="Scan ID">
        <span className="mis-scan-id">{row.scanCode}</span>
        {row.uploadedAt ? <span className="mis-cab-audio-meta" style={{ display: 'block' }}>{row.uploadedAt}</span> : null}
      </td>
      <td data-label="Client">{row.clientName || '—'}</td>
      {isAdmin ? <td data-label="Mentor">{row.mentorName}</td> : null}
      <td data-label={isTrainee ? 'Mentor' : 'Mentee'}>{isTrainee ? row.mentorName : row.menteeName}</td>
      <td data-label="Audio File">
        <div className="mis-cab-audio-cell">
          <div className="mis-cab-audio-text">
            <span className="mis-cab-audio-title">{row.audio.title}</span>
            <span className="mis-cab-audio-meta">{row.audio.fileName}</span>
          </div>
          <CabPlayButton
            url={row.audio.url}
            title={row.audio.title}
            durationSec={row.audio.durationSec}
            className="reports-cab-play mis-cab-audio-play"
            compact
          />
        </div>
      </td>
      {!isTrainee ? (
        <td data-label="Mentor credit" className="col-center">
          {upload ? (
            <>
              <span className="trainees-status" style={approvalStyles(upload.approvalStatus)}>
                {approvalLabel(upload)}
              </span>
              {isAdmin && upload.approvalStatus === 'Pending' ? (
                <div className="mis-cab-actions" style={{ marginTop: 6 }}>
                  <button type="button" className="scans-action-btn scans-action-export" disabled={busy} onClick={() => onReview(true)}>
                    Approve
                  </button>
                  <button type="button" className="scans-action-btn scans-action-danger" disabled={busy} onClick={() => onReview(false)}>
                    Reject
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <span className="trainees-status" style={mutedChip}>
              —
            </span>
          )}
        </td>
      ) : null}
      <td data-label={isTrainee ? 'Charge' : 'Mentee debit'} className="col-center">
        {debitCell}
      </td>
    </tr>
  );
}
