import { useCallback, useEffect, useMemo, useState } from 'react';
import { approveTopUp, declineTopUp, getPendingTopUps } from '../../api';
import { openAuthenticatedAsset } from '../../api/assetUrl';
import type { AdminTopUpRequest } from '../../api/notificationTypes';
import { colors, radius, spacing } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';

const theme = colors.light;

type AdminTopUpsPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  initialRequestId?: number | null;
  onNavigate?: (view: import('../Layout/navItems').AppView, target?: string) => void;
};

export function AdminTopUpsPage({
  onOpenMobileMenu,
  onOpenProfile,
  initialRequestId = null,
  onNavigate,
}: AdminTopUpsPageProps) {
  const [requests, setRequests] = useState<AdminTopUpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(initialRequestId);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [acting, setActing] = useState(false);

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

  const selected = filtered.find((row) => row.id === selectedId) ?? requests.find((row) => row.id === selectedId) ?? null;

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 5000);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActing(true);
    try {
      const result = await approveTopUp(selected.id);
      setRequests((current) => current.filter((row) => row.id !== selected.id));
      showNotice(result.message);
    } catch {
      showNotice('Unable to approve this top-up.');
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
      showNotice(result.message);
    } catch {
      showNotice('Unable to decline this top-up.');
    } finally {
      setActing(false);
    }
  };

  const handleViewProof = () => {
    if (!selected?.proof_file_id) return;
    void openAuthenticatedAsset(`/api/files/${selected.proof_file_id}`);
  };

  if (loading) {
    return (
      <section className="page-section">
        <p style={{ color: theme['text-muted'], fontSize: 14 }}>Loading top-up requests…</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page-section">
        <EmptyState title={loadError} description="Check your connection and try again." />
      </section>
    );
  }

  return (
    <section className="page-section trainees-page">
      <div className="page-header">
        <div className="page-title-block" style={{ minWidth: 0, flex: 1 }}>
          <h1 className="page-title" style={{ margin: 0, color: theme['text-primary'] }}>
            Top-up Requests
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Verify ledger top-ups submitted by trainees and mentors.
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

      {notice && (
        <div
          style={{
            marginBottom: spacing[4],
            padding: '12px 16px',
            borderRadius: radius.md,
            background: theme['success-bg'],
            color: theme.success,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {notice}
        </div>
      )}

      <div className="trainees-layout" style={{ gap: spacing[5] }}>
        <div className="dash-card trainees-panel" style={{ padding: 0 }}>
          <div className="trainees-panel-header" style={{ padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${theme.divider}` }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>Pending</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: theme['text-muted'] }}>{filtered.length} request{filtered.length === 1 ? '' : 's'}</p>
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
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search member or amount"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%', fontFamily: 'inherit' }}
              />
            </label>
          </div>
          <div className="trainees-list">
            {filtered.length === 0 ? (
              <p style={{ padding: spacing[4], margin: 0, fontSize: 13, color: theme['text-muted'] }}>No pending top-ups.</p>
            ) : (
              filtered.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`trainees-list-item${selected?.id === row.id ? ' is-active' : ''}`}
                  onClick={() => setSelectedId(row.id)}
                >
                  <span className="trainees-list-name">{row.member_name}</span>
                  <span className="trainees-list-meta">{row.amount} · {row.submitted_at}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="dash-card trainees-detail" style={{ padding: spacing[5], minHeight: 320 }}>
          {!selected ? (
            <EmptyState title="Select a request" description="Choose a pending top-up from the list to review proof and take action." />
          ) : (
            <>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>{selected.member_name}</h2>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
                {selected.member_email} · {selected.member_role}
              </p>
              <div style={{ marginTop: spacing[5], display: 'grid', gap: spacing[3] }}>
                <div>
                  <span style={{ fontSize: 12, color: theme['text-muted'] }}>Amount</span>
                  <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: theme['text-primary'] }}>{selected.amount}</p>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: theme['text-muted'] }}>Submitted</span>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: theme['text-primary'] }}>{selected.submitted_at}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: spacing[5] }}>
                <button type="button" className="btn-pill-secondary" disabled={!selected.proof_file_id} onClick={handleViewProof}>
                  View proof
                </button>
                <button type="button" className="btn-pill-primary" disabled={acting} onClick={handleApprove}>
                  {acting ? 'Working…' : 'Approve & credit'}
                </button>
                <button type="button" className="scans-action-btn scans-action-danger" disabled={acting} onClick={handleDecline}>
                  Decline
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
