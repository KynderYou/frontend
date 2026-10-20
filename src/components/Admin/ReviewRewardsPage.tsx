import { useEffect, useMemo, useState } from 'react';
import { LuExternalLink } from 'react-icons/lu';
import { getReviewRewards } from '../../api';
import type { ReviewRewardsApi } from '../../api/types';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { initials } from '../../utils/initials';
import { EmptyState } from '../common/EmptyState';
import { TablePager } from '../common/TablePager';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';

const theme = colors.light;
const MEMBERS_PAGE_SIZE = 10;
const FIRST_YEAR = 2024;

type ReviewRewardsPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function rupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function ReviewRewardsPage({ onOpenMobileMenu, onOpenProfile }: ReviewRewardsPageProps) {
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: Math.max(1, currentYear - FIRST_YEAR + 1) }, (_, i) => currentYear - i),
    [currentYear],
  );
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<ReviewRewardsApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [memberId, setMemberId] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getReviewRewards(year, controller.signal)
      .then((result) => {
        setData(result);
        setLoadError('');
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError('Unable to load review rewards.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [year]);

  const members = useMemo(() => data?.members ?? [], [data]);

  const visibleMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) => [member.name, member.role].some((value) => value.toLowerCase().includes(q)));
  }, [members, query]);

  const pagination = useClientPagination(visibleMembers, MEMBERS_PAGE_SIZE, `${year}|${query}`);

  const openMember = members.find((member) => member.member_id === memberId) ?? null;
  const openEntries = useMemo(
    () => (memberId === null ? [] : (data?.entries ?? []).filter((entry) => entry.posted_by_id === memberId)),
    [data, memberId],
  );

  useEffect(() => {
    if (memberId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMemberId(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [memberId]);

  return (
    <section className="page-section trainees-page review-rewards-page">
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
            Review Rewards
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Rewards admins assigned to client reviews. These are not credited to any ledger; use this list for the annual payout.
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

      <div className="review-rewards-stats">
        <div className="dash-card review-rewards-stat is-primary">
          <span>Total payable · {year}</span>
          <strong>{rupees(data?.total ?? 0)}</strong>
        </div>
        <div className="dash-card review-rewards-stat">
          <span>Members rewarded</span>
          <strong>{members.length}</strong>
        </div>
        <div className="dash-card review-rewards-stat">
          <span>Rewarded reviews</span>
          <strong>{data?.entries.length ?? 0}</strong>
        </div>
        <label className="dash-card review-rewards-stat review-rewards-year">
          <span>Year</span>
          <select
            value={year}
            onChange={(e) => {
              setLoading(true);
              setYear(Number(e.target.value));
            }}
            aria-label="Reward year"
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="dash-card reviews-table-skeleton" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="reviews-row-skeleton" />
          ))}
        </div>
      ) : loadError ? (
        <div className="dash-card" style={{ padding: spacing[2] }}>
          <EmptyState title="Could not load review rewards" description={loadError} />
        </div>
      ) : members.length === 0 ? (
        <div className="dash-card" style={{ padding: spacing[2] }}>
          <EmptyState
            title={`No rewards for ${year}`}
            description="When an admin rewards a review (₹50, ₹100 or ₹150) on MIS · Reviews, it will be listed here."
          />
        </div>
      ) : (
        <div className="dash-card trainees-table-panel" style={{ padding: 0, minWidth: 0 }}>
          <div className="review-rewards-panel-head is-row">
            <div>
              <h2>Reward tracker · {year}</h2>
              <p>Total per member. Click a row to see each reward.</p>
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: theme['bg-muted'],
                borderRadius: radius.md,
                padding: '8px 12px',
                minWidth: 200,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme['text-muted']} strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search member"
                aria-label="Search members"
                className="reviews-search-input"
              />
            </label>
          </div>
          <div className="trainees-table-body">
            <table className="mis-data-table trainees-data-table review-rewards-tracker">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th className="col-center">Rewards</th>
                  <th className="col-right">Total amount</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {visibleMembers.length === 0 ? (
                  <tr className="mis-data-empty">
                    <td colSpan={5}>No member matches your search.</td>
                  </tr>
                ) : (
                  pagination.pageItems.map((member) => (
                    <tr
                      key={member.member_id}
                      className="review-rewards-member"
                      tabIndex={0}
                      onClick={() => setMemberId(member.member_id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setMemberId(member.member_id);
                      }}
                    >
                      <td data-label="Member">
                        <span className="review-row-poster">
                          <span className="review-rewards-avatar" aria-hidden="true">
                            {initials(member.name)}
                          </span>
                          <strong className="review-rewards-name">{member.name}</strong>
                        </span>
                      </td>
                      <td data-label="Role">{member.role}</td>
                      <td data-label="Rewards" className="col-center">
                        <span className="review-rewards-count">{member.reviews}</span>
                      </td>
                      <td data-label="Total amount" className="col-right review-rewards-amount">
                        {rupees(member.total)}
                      </td>
                      <td className="col-right review-rewards-chevron" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 6 6 6-6 6" />
                        </svg>
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

      {openMember ? (
        <div className="modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setMemberId(null)}>
          <div
            className="modal-panel review-rewards-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-rewards-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="review-rewards-modal-title" className="modal-title">
                  {openMember.name}
                </h2>
                <p className="modal-subtitle">
                  {openMember.role} · {openMember.reviews} reward{openMember.reviews === 1 ? '' : 's'} in {year} ·{' '}
                  <strong className="review-rewards-amount">{rupees(openMember.total)}</strong>
                </p>
              </div>
              <button type="button" className="btn-icon" aria-label="Close" onClick={() => setMemberId(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <table className="mis-data-table trainees-data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Posted on</th>
                    <th>Review</th>
                    <th>Rewarded by</th>
                    <th className="col-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {openEntries.map((entry, index) => (
                    <tr key={entry.review_id}>
                      <td data-label="#">{index + 1}</td>
                      <td data-label="Posted on" className="review-row-date">
                        {entry.posted_at}
                      </td>
                      <td data-label="Review">
                        {entry.kind_label}
                        <span className="mis-cab-meta">
                          {entry.client_name || 'No client name'}
                          {entry.link ? (
                            <>
                              {' · '}
                              <a className="review-row-link" href={entry.link} target="_blank" rel="noopener noreferrer">
                                <LuExternalLink size={12} />
                                Open
                              </a>
                            </>
                          ) : null}
                        </span>
                      </td>
                      <td data-label="Rewarded by">
                        {entry.rewarded_by_name || '—'}
                        {entry.rewarded_at ? <span className="mis-cab-meta">{entry.rewarded_at}</span> : null}
                      </td>
                      <td data-label="Amount" className="col-right review-rewards-amount">
                        {rupees(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="review-rewards-total-row">
                    <td colSpan={4}>Total</td>
                    <td className="col-right review-rewards-amount">{rupees(openMember.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-pill-secondary" onClick={() => setMemberId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
