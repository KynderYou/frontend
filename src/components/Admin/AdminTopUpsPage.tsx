import { useCallback, useEffect, useMemo, useState } from 'react';
import { approveTopUp, declineTopUp, getPendingTopUps } from '../../api';
import { fetchAuthenticatedAsset } from '../../api/assetUrl';
import type { AdminTopUpRequest } from '../../api/notificationTypes';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';

const theme = colors.light;
const TOPUP_LIST_PAGE_SIZE = 12;

type AdminTopUpsPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  initialRequestId?: number | null;
  onNavigate?: (view: import('../Layout/navItems').AppView, target?: string) => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function AdminTopUpsPage({
  onOpenMobileMenu,
  onOpenProfile,
  initialRequestId = null,
  onNavigate,
}: AdminTopUpsPageProps) {
  const { showSuccess, showError } = useToast();
  const [requests, setRequests] = useState<AdminTopUpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(initialRequestId);
  const [query, setQuery] = useState('');
  const [acting, setActing] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState('');

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const state = await getPendingTopUps(signal);
      setRequests(state.requests);
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load top-up requests.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (initialRequestId) setSelectedId(initialRequestId);
  }, [initialRequestId]);

  useEffect(() => {
    if (requests.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !requests.some((row) => row.id === selectedId)) {
      setSelectedId(requests[0].id);
    }
  }, [requests, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (row) =>
        row.member_name.toLowerCase().includes(q) ||
        row.member_email.toLowerCase().includes(q) ||
        row.amount.toLowerCase().includes(q),
    );
  }, [query, requests]);

  const listPagination = useClientPagination(filtered, TOPUP_LIST_PAGE_SIZE, query);

  const selected = filtered.find((row) => row.id === selectedId) ?? requests.find((row) => row.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected?.proof_file_id) {
      setProofUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setProofError('');
      return;
    }

    const controller = new AbortController();
    setProofLoading(true);
    setProofError('');
    fetchAuthenticatedAsset(`/api/files/${selected.proof_file_id}`, controller.signal)
      .then((url) => {
        setProofUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {
        setProofUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setProofError('Unable to load payment proof.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setProofLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [selected?.id, selected?.proof_file_id]);

  useEffect(
    () => () => {
      if (proofUrl) URL.revokeObjectURL(proofUrl);
    },
    [proofUrl],
  );

  const handleApprove = async () => {
    if (!selected) return;
    setActing(true);
    try {
      const result = await approveTopUp(selected.id);
      setRequests((current) => current.filter((row) => row.id !== selected.id));
      showSuccess(result.message);
    } catch {
      showError('Unable to approve this top-up.');
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    if (!selected) return;
    setActing(true);
    try {
      const result = await declineTopUp(selected.id);
      setRequests((current) => current.filter((row) => row.id !== selected.id));
      showSuccess(result.message);
    } catch {
      showError('Unable to decline this top-up.');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <section className="page-section trainees-page">
        <p style={{ color: theme['text-muted'], fontSize: 14 }}>Loading top-up requests…</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page-section trainees-page">
        <EmptyState title={loadError} description="Check your connection and try again." />
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
            Top-up Requests
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Verify payment proof and credit member ledgers.
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <NotificationButton onNavigate={onNavigate} />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      <div className="trainees-layout" style={{ gap: spacing[5] }}>
        <div className="dash-card trainees-panel" style={{ padding: 0 }}>
          <div className="trainees-panel-header" style={{ padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${theme.divider}` }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>Pending requests</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: theme['text-muted'] }}>
              {filtered.length} of {requests.length}
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search member or amount"
                aria-label="Search top-up requests"
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

          <div role="listbox" aria-label="Pending top-up requests" className="trainees-panel-scroll">
            {filtered.length === 0 ? (
              <p style={{ padding: spacing[5], margin: 0, fontSize: 13, color: theme['text-muted'], textAlign: 'center' }}>
                No pending top-ups.
              </p>
            ) : (
              listPagination.pageItems.map((row) => {
                const active = selected?.id === row.id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => setSelectedId(row.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: `${spacing[3]} ${spacing[5]}`,
                      border: 'none',
                      borderBottom: `1px solid ${theme.divider}`,
                      background: active ? theme['primary-soft'] : theme['bg-surface'],
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      color: 'inherit',
                      borderLeft: active ? `3px solid ${theme.primary}` : '3px solid transparent',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: active ? theme.primary : theme['bg-muted'],
                        color: active ? '#fff' : theme.primary,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {initials(row.member_name)}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: theme['text-primary'], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.member_name}
                      </div>
                      <div style={{ fontSize: 11, color: theme['text-muted'], marginTop: 2 }}>
                        {row.amount} · {row.submitted_at}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: theme.warning,
                        background: theme['warning-bg'],
                        borderRadius: radius.pill,
                        padding: '3px 8px',
                        flexShrink: 0,
                      }}
                    >
                      Pending
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <TablePager
            page={listPagination.page}
            pageSize={listPagination.pageSize}
            total={listPagination.total}
            onPageChange={listPagination.setPage}
            className="mis-table-footer"
          />
        </div>

        <div className="dash-card trainees-table-panel" style={{ padding: 0, minWidth: 0 }}>
          {!selected ? (
            <div style={{ padding: spacing[6] }}>
              <EmptyState title="Select a request" description="Choose a pending top-up from the list to review proof and take action." />
            </div>
          ) : (
            <>
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
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>{selected.member_name}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>
                    {selected.member_email} · {selected.member_role}
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginLeft: 'auto' }}>
                  <button type="button" className="btn-pill-secondary" disabled={acting} onClick={handleDecline} style={{ height: 38 }}>
                    Decline
                  </button>
                  <button type="button" className="btn-pill-primary" disabled={acting} onClick={handleApprove} style={{ height: 38, minWidth: 148 }}>
                    {acting ? 'Working…' : 'Approve & credit'}
                  </button>
                </div>
              </div>

              <div style={{ padding: `${spacing[5]} ${spacing[6]}` }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: spacing[4],
                    marginBottom: spacing[5],
                  }}
                >
                  <div
                    style={{
                      padding: spacing[4],
                      borderRadius: radius.md,
                      background: theme['bg-muted'],
                      border: `1px solid ${theme.divider}`,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: theme['text-muted'], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Amount
                    </div>
                    <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: theme['text-primary'] }}>{selected.amount}</div>
                  </div>
                  <div
                    style={{
                      padding: spacing[4],
                      borderRadius: radius.md,
                      background: theme['bg-muted'],
                      border: `1px solid ${theme.divider}`,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: theme['text-muted'], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Submitted
                    </div>
                    <div style={{ marginTop: 8, fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>{selected.submitted_at}</div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3], marginBottom: spacing[3] }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>Payment proof</h3>
                    {!selected.proof_file_id && (
                      <span style={{ fontSize: 12, color: theme['text-muted'] }}>No proof uploaded</span>
                    )}
                  </div>

                  {proofLoading ? (
                    <div
                      style={{
                        minHeight: 220,
                        borderRadius: radius.md,
                        border: `1px dashed ${theme.divider}`,
                        display: 'grid',
                        placeItems: 'center',
                        color: theme['text-muted'],
                        fontSize: 13,
                        background: theme['bg-muted'],
                      }}
                    >
                      Loading proof…
                    </div>
                  ) : proofError ? (
                    <div
                      style={{
                        minHeight: 120,
                        borderRadius: radius.md,
                        border: `1px solid ${theme.divider}`,
                        display: 'grid',
                        placeItems: 'center',
                        color: theme.error,
                        fontSize: 13,
                        background: theme['error-bg'],
                        padding: spacing[4],
                      }}
                    >
                      {proofError}
                    </div>
                  ) : proofUrl ? (
                    <div
                      style={{
                        borderRadius: radius.md,
                        border: `1px solid ${theme.divider}`,
                        overflow: 'hidden',
                        background: theme['bg-muted'],
                      }}
                    >
                      <img
                        src={proofUrl}
                        alt={`Payment proof for ${selected.member_name}`}
                        style={{ display: 'block', width: '100%', maxHeight: 420, objectFit: 'contain', background: '#fff' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        minHeight: 120,
                        borderRadius: radius.md,
                        border: `1px dashed ${theme.divider}`,
                        display: 'grid',
                        placeItems: 'center',
                        color: theme['text-muted'],
                        fontSize: 13,
                        background: theme['bg-muted'],
                      }}
                    >
                      Select a request with uploaded proof to preview it here.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
