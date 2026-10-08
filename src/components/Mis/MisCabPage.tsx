import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, getCabState, getMe, reviewCabFeedback } from '../../api';
import type { CabStateApi } from '../../api/types';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { ProtectedAudio } from '../common/ProtectedAudio';
import { SkeletonCabPage } from '../common/Skeleton';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { mapCabState } from './cabApiMapper';
import type { CabFeedback, CabFeedbackStatus } from './cabData';

const theme = colors.light;
const CAB_PAGE_SIZE = 12;

type MisCabPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  /** Prefill the search with this scan (notification deep link). */
  initialScanCode?: string | null;
  onClearInitialScan?: () => void;
};

function statusStyles(status: CabFeedbackStatus) {
  if (status === 'Approved') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Rejected') return { color: theme.error, background: theme['error-bg'] };
  return { color: theme.warning, background: theme['warning-bg'] };
}

function statusLabel(row: CabFeedback) {
  if (row.status === 'Approved') return row.mentorId != null ? `Credited · ${row.creditAmount}` : 'Approved';
  if (row.status === 'Rejected') return 'Rejected';
  return 'Awaiting H.O approval';
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="mis-cab-stars" aria-label={`${rating} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} className={value <= rating ? 'is-on' : undefined}>
          ★
        </span>
      ))}
    </span>
  );
}

export function MisCabPage({
  onOpenMobileMenu,
  onOpenProfile,
  initialScanCode = null,
  onClearInitialScan,
}: MisCabPageProps) {
  const { showSuccess, showError } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedback, setFeedback] = useState<CabFeedback[]>([]);
  const [companyBalance, setCompanyBalance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState(initialScanCode ?? '');

  useEffect(() => {
    if (initialScanCode) onClearInitialScan?.();
  }, [initialScanCode, onClearInitialScan]);

  const applyState = useCallback((state: CabStateApi) => {
    const mapped = mapCabState(state);
    setFeedback(mapped.feedback);
    setCompanyBalance(mapped.companyBalance);
  }, []);

  const loadState = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [member, state] = await Promise.all([getMe(signal), getCabState(signal)]);
      setIsAdmin(member.role === 'Admin');
      applyState(state);
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load CAB feedback.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [applyState]);

  useEffect(() => {
    const controller = new AbortController();
    loadState(controller.signal);
    return () => controller.abort();
  }, [loadState]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return feedback;
    return feedback.filter(
      (row) =>
        row.scanCode.toLowerCase().includes(q) ||
        row.clientName.toLowerCase().includes(q) ||
        row.menteeName.toLowerCase().includes(q) ||
        row.mentorName.toLowerCase().includes(q) ||
        row.comments.toLowerCase().includes(q)
    );
  }, [feedback, query]);

  const pagination = useClientPagination(filtered, CAB_PAGE_SIZE, query);
  const pendingCount = feedback.filter((row) => row.status === 'Pending').length;

  const handleReview = async (row: CabFeedback, approve: boolean) => {
    if (busy) return;
    const paysMentor = row.mentorId != null;
    const confirmText = paysMentor
      ? `Approve feedback for ${row.scanCode}? ${row.creditAmount} will be debited from the company ledger and credited to ${row.mentorName}.`
      : `Approve feedback for ${row.scanCode}? The mentee has no mentor, so no credit is paid.`;
    if (approve && !window.confirm(confirmText)) return;
    setBusy(true);
    try {
      applyState(await reviewCabFeedback(row.id, approve));
      showSuccess(
        !approve
          ? `Feedback for ${row.scanCode} rejected.`
          : paysMentor
            ? `${row.creditAmount} credited to ${row.mentorName}.`
            : `Feedback for ${row.scanCode} approved.`,
      );
    } catch (err) {
      const detail = err instanceof ApiError ? (err.body as { detail?: unknown } | null)?.detail : null;
      showError(typeof detail === 'string' ? detail : 'Unable to update CAB feedback.');
    } finally {
      setBusy(false);
    }
  };

  const header = (
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
            ? 'Mentee feedback on CAB sent by mentors. Approving debits the company ledger and credits the mentor.'
            : 'Feedback on counselling audio bytes for your scans and mentees.'}
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
  );

  if (loading) {
    return (
      <section className="page-section trainees-page mis-cab-page">
        {header}
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

  return (
    <section className="page-section trainees-page mis-cab-page">
      {header}

      {feedback.length === 0 ? (
        <div className="dash-card" style={{ padding: spacing[2] }}>
          <EmptyState
            title="No CAB feedback yet"
            description="When a mentee rates a CAB from My Reports, it will appear here."
          />
        </div>
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
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>CAB feedback</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>
                {filtered.length} feedback · {pendingCount} awaiting approval
                {isAdmin && companyBalance ? ` · Company balance ${companyBalance}` : ''}
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
                placeholder="Search feedback"
                aria-label="Search CAB feedback"
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
                  <th>Mentee</th>
                  <th>Mentor</th>
                  <th>MRP</th>
                  <th>Rating</th>
                  <th>Feedback</th>
                  <th className="col-center">Credit</th>
                  <th className="col-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className="mis-data-empty">
                    <td colSpan={9}>No CAB feedback matches your search.</td>
                  </tr>
                ) : (
                  pagination.pageItems.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Scan ID">
                        <span className="mis-scan-id">{row.scanCode}</span>
                        <span className="mis-cab-meta">{row.submittedAt}</span>
                      </td>
                      <td data-label="Client">{row.clientName || '—'}</td>
                      <td data-label="Mentee">
                        {row.menteeName}
                        <span className="mis-cab-meta">Billing {row.menteeBilling}</span>
                      </td>
                      <td data-label="Mentor">{row.mentorName}</td>
                      <td data-label="MRP">{row.mrp || '—'}</td>
                      <td data-label="Rating">
                        <Stars rating={row.rating} />
                      </td>
                      <td data-label="Feedback">
                        <span className="mis-cab-comments">{row.comments || (row.audioUrl ? '' : '—')}</span>
                        {row.audioUrl ? <ProtectedAudio path={row.audioUrl} className="mis-cab-audio" /> : null}
                      </td>
                      <td data-label="Credit" className="col-center">
                        {row.creditAmount}
                      </td>
                      <td data-label="Status" className="col-center">
                        <span className="trainees-status" style={statusStyles(row.status)}>
                          {statusLabel(row)}
                        </span>
                        {isAdmin && row.status === 'Pending' ? (
                          <div className="mis-cab-actions" style={{ marginTop: 6 }}>
                            <button
                              type="button"
                              className="scans-action-btn scans-action-export"
                              disabled={busy}
                              onClick={() => void handleReview(row, true)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="scans-action-btn scans-action-danger"
                              disabled={busy}
                              onClick={() => void handleReview(row, false)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
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
    </section>
  );
}
