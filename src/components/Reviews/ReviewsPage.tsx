import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { LuExternalLink, LuPlus } from 'react-icons/lu';
import { ApiError, createReview, deleteReview, getReviews, setReviewReward } from '../../api';
import type { NewReview } from '../../api/endpoints/reviews';
import type { ReviewApi, ReviewKind, ReviewRewardAmount } from '../../api/types';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { initials } from '../../utils/initials';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { TablePager } from '../common/TablePager';
import { TrashButton } from '../common/TrashButton';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { isAdminRole } from '../../utils/roles';
import { useCurrentMember } from '../Auth/MemberContext';
import { useNetworkHierarchy } from '../Network/useNetworkHierarchy';
import { useProtectedFile } from '../../hooks/useProtectedFile';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { AddReviewModal } from './AddReviewModal';
import { CompactAudio } from './CompactAudio';
import { ReviewRewardModal } from './ReviewRewardModal';
import { ReviewsPeopleTree } from './ReviewsPeopleTree';
import { REVIEW_KIND_OPTIONS } from './reviewKinds';

const theme = colors.light;
const REVIEWS_PAGE_SIZE = 10;

type KindFilter = ReviewKind | 'all';

type ReviewsPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function apiErrorDetail(err: unknown, fallback: string) {
  const detail = err instanceof ApiError ? (err.body as { detail?: unknown } | null)?.detail : null;
  return typeof detail === 'string' ? detail : fallback;
}

function ReviewProof({ review }: { review: ReviewApi }) {
  const src = useProtectedFile(review.file_url);
  const link = review.link ? (
    <a className="review-row-link" href={review.link} target="_blank" rel="noopener noreferrer">
      <LuExternalLink size={13} />
      Open
    </a>
  ) : null;
  if (!review.file_url) return link ?? <span className="review-row-muted">—</span>;
  if (!src) return <span className="review-row-thumb is-loading" aria-hidden="true" />;
  if (review.kind === 'audio' || review.file_mime?.startsWith('audio/')) {
    return <CompactAudio src={src} label={review.kind_label} />;
  }
  return (
    <span className="review-row-proof">
      <a className="review-row-thumb" href={src} target="_blank" rel="noopener noreferrer" title="Open picture">
        <img src={src} alt={`${review.kind_label} screenshot`} />
      </a>
      {link}
    </span>
  );
}

type ReviewRowProps = {
  review: ReviewApi;
  showReward: boolean;
  onReward: (review: ReviewApi) => void;
  onDelete: (review: ReviewApi) => void;
};

function ReviewRow({ review, showReward, onReward, onDelete }: ReviewRowProps) {
  const option = REVIEW_KIND_OPTIONS.find((o) => o.id === review.kind) ?? REVIEW_KIND_OPTIONS[3];
  const reward = review.reward_amount ?? null;
  const link = review.link;
  const openLink = (e: MouseEvent<HTMLTableRowElement> | KeyboardEvent<HTMLTableRowElement>) => {
    if (!link) return;
    if ((e.target as HTMLElement).closest('a, button, input, audio, .compact-audio')) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };
  return (
    <tr
      className={`review-row tone-${option.tone}${link ? ' is-link' : ''}`}
      title={link ? 'Open review' : undefined}
      tabIndex={link ? 0 : undefined}
      onClick={link ? openLink : undefined}
      onKeyDown={
        link
          ? (e) => {
              if (e.key === 'Enter' && e.target === e.currentTarget) openLink(e);
            }
          : undefined
      }
    >
      <td data-label="Type">
        <span className="review-kind-badge">
          {option.icon}
          {review.kind_label}
        </span>
      </td>
      <td data-label="Client">
        <span className="review-row-client">{review.client_name || '—'}</span>
        {review.caption ? <span className="review-row-caption">{review.caption}</span> : null}
      </td>
      <td data-label="Proof">
        <ReviewProof review={review} />
      </td>
      <td data-label="Posted by">
        <span className="review-row-poster">
          <span className="review-poster-avatar" aria-hidden="true">
            {initials(review.posted_by_name)}
          </span>
          <span className="review-poster">
            <strong>{review.posted_by_name}</strong>
            <span>{review.posted_by_role}</span>
          </span>
        </span>
      </td>
      <td data-label="Posted on" className="review-row-date">
        {review.posted_at}
      </td>
      {showReward ? (
        <td data-label="Reward">
          {review.can_reward ? (
            <button
              type="button"
              className={`review-reward-pill${reward ? ' is-rewarded' : ''}`}
              title={reward ? 'Change or remove the reward' : 'Reward this review'}
              onClick={() => onReward(review)}
            >
              {reward ? `₹${reward} rewarded` : 'Reward'}
            </button>
          ) : null}
          {reward && review.rewarded_by_name ? (
            <span className="review-reward-meta">by {review.rewarded_by_name}</span>
          ) : null}
        </td>
      ) : null}
      <td data-label="" className="col-center">
        {review.can_delete ? <TrashButton label="Delete review" onClick={() => onDelete(review)} /> : null}
      </td>
    </tr>
  );
}

export function ReviewsPage({ onOpenMobileMenu, onOpenProfile }: ReviewsPageProps) {
  const { showSuccess, showError } = useToast();
  const [reviews, setReviews] = useState<ReviewApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<KindFilter>('all');
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const isAdminViewer = isAdminRole(useCurrentMember()?.role);
  const hierarchy = useNetworkHierarchy(isAdminViewer);
  const [personId, setPersonId] = useState<number | null>(null);
  const [deletingReview, setDeletingReview] = useState<ReviewApi | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rewardingReview, setRewardingReview] = useState<ReviewApi | null>(null);
  const [rewardSaving, setRewardSaving] = useState(false);

  const loadReviews = useCallback(async (signal?: AbortSignal) => {
    try {
      setReviews(await getReviews(signal));
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load reviews.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadReviews(controller.signal);
    return () => controller.abort();
  }, [loadReviews]);

  const postedCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const review of reviews) counts.set(review.posted_by_id, (counts.get(review.posted_by_id) ?? 0) + 1);
    return counts;
  }, [reviews]);

  const personReviews = useMemo(
    () => (personId === null ? reviews : reviews.filter((review) => review.posted_by_id === personId)),
    [reviews, personId],
  );

  const personName = useMemo(() => {
    if (personId === null) return '';
    const people = [...hierarchy.admins, ...hierarchy.mentors, ...hierarchy.mentees];
    return people.find((person) => person.id === personId)?.name ?? '';
  }, [hierarchy, personId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return personReviews.filter((review) => {
      if (filter !== 'all' && review.kind !== filter) return false;
      if (!q) return true;
      return [review.client_name, review.caption, review.posted_by_name, review.kind_label]
        .some((value) => value.toLowerCase().includes(q));
    });
  }, [personReviews, filter, query]);

  const pagination = useClientPagination(filtered, REVIEWS_PAGE_SIZE, `${filter}|${query}|${personId ?? ''}`);

  const handleAdd = async (review: NewReview) => {
    setSubmitting(true);
    setAddError('');
    try {
      const created = await createReview(review);
      setReviews((prev) => [created, ...prev]);
      setAddOpen(false);
      showSuccess(`${created.kind_label} posted.`);
    } catch (err) {
      const message = apiErrorDetail(err, 'Could not post the review. Please try again.');
      setAddError(message);
      if (err instanceof ApiError && err.status === 409) showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (review: ReviewApi) => {
    setDeleting(true);
    try {
      await deleteReview(review.id);
      setReviews((prev) => prev.filter((row) => row.id !== review.id));
      setDeletingReview(null);
      showSuccess('Review deleted.');
    } catch (err) {
      showError(apiErrorDetail(err, 'Could not delete the review.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleReward = async (review: ReviewApi, amount: ReviewRewardAmount | null) => {
    setRewardSaving(true);
    try {
      const updated = await setReviewReward(review.id, amount);
      setReviews((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setRewardingReview(null);
      showSuccess(amount ? `₹${amount} reward recorded for ${review.posted_by_name}.` : 'Reward cleared.');
    } catch (err) {
      showError(apiErrorDetail(err, 'Could not save the reward.'));
    } finally {
      setRewardSaving(false);
    }
  };

  const countFor = (kind: KindFilter) =>
    kind === 'all' ? personReviews.length : personReviews.filter((r) => r.kind === kind).length;

  return (
    <section className="page-section trainees-page reviews-page">
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
            MIS · Reviews
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 16, color: theme['text-secondary'] }}>
            Client reviews collected across the network: Google, Instagram, audio and other social media.
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

      <div className={`trainees-layout reviews-layout${isAdminViewer ? '' : ' trainees-layout--single'}`} style={{ gap: spacing[5] }}>
        {isAdminViewer ? (
          <ReviewsPeopleTree
            hierarchy={hierarchy}
            counts={postedCounts}
            total={reviews.length}
            selectedId={personId}
            onSelect={setPersonId}
          />
        ) : null}
        <div className="reviews-main">
          {personName ? (
            <div className="reviews-person-chip">
              <span>
                Showing reviews posted by <strong>{personName}</strong>
              </span>
              <button type="button" onClick={() => setPersonId(null)} aria-label="Show everyone's reviews">
                × Everyone
              </button>
            </div>
          ) : null}
          <div className="dash-card reviews-toolbar">
            <div className="reviews-filters" role="tablist" aria-label="Filter by review type">
              {(['all', ...REVIEW_KIND_OPTIONS.map((o) => o.id)] as KindFilter[]).map((kind) => {
                const label = kind === 'all' ? 'All' : REVIEW_KIND_OPTIONS.find((o) => o.id === kind)?.label;
                return (
                  <button
                    key={kind}
                    type="button"
                    role="tab"
                    aria-selected={filter === kind}
                    className={`reviews-filter${filter === kind ? ' is-active' : ''}`}
                    onClick={() => setFilter(kind)}
                  >
                    {label}
                    <span className="reviews-filter-count">{countFor(kind)}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
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
                  placeholder="Search client or member"
                  aria-label="Search reviews"
                  className="reviews-search-input"
                />
              </label>
              <button
                type="button"
                className="btn-pill-primary reviews-add-btn"
                aria-label="Add review"
                title="Add review"
                onClick={() => {
                  setAddError('');
                  setAddOpen(true);
                }}
              >
                <LuPlus size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="dash-card reviews-table-skeleton" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="reviews-row-skeleton" />
              ))}
            </div>
          ) : loadError ? (
            <div className="dash-card" style={{ padding: spacing[2] }}>
              <EmptyState title="Could not load reviews" description={loadError} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="dash-card" style={{ padding: spacing[2] }}>
              <EmptyState
                title={
                  personReviews.length > 0
                    ? 'No matching reviews'
                    : personName
                      ? `No reviews from ${personName} yet`
                      : 'No reviews yet'
                }
                description={
                  personReviews.length > 0
                    ? 'Try another review type or search.'
                    : personName
                      ? 'Pick someone else, or press + to add a review.'
                      : 'Press + to add the first client review.'
                }
              />
            </div>
          ) : (
            <div className="dash-card trainees-table-panel reviews-table-panel" style={{ padding: 0, minWidth: 0 }}>
              <div className="trainees-table-body">
                <table className="mis-data-table trainees-data-table reviews-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Client</th>
                      <th>Proof</th>
                      <th>Posted by</th>
                      <th>Posted on</th>
                      {isAdminViewer ? <th>Reward</th> : null}
                      <th className="col-center" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.pageItems.map((review) => (
                      <ReviewRow
                        key={review.id}
                        review={review}
                        showReward={isAdminViewer}
                        onReward={setRewardingReview}
                        onDelete={setDeletingReview}
                      />
                    ))}
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
        </div>
      </div>

      {addOpen ? (
        <AddReviewModal
          open
          onClose={() => setAddOpen(false)}
          onSubmit={handleAdd}
          submitting={submitting}
          error={addError}
        />
      ) : null}
      <ReviewRewardModal
        key={rewardingReview?.id ?? 'none'}
        review={rewardingReview}
        busy={rewardSaving}
        onClose={() => setRewardingReview(null)}
        onSave={(row, amount) => void handleReward(row, amount)}
      />
      <ConfirmModal
        open={deletingReview != null}
        title={`Delete this ${deletingReview?.kind_label.toLowerCase() ?? 'review'}?`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onClose={() => setDeletingReview(null)}
        onConfirm={() => deletingReview && void handleDelete(deletingReview)}
      >
        This removes it for everyone. This action cannot be undone.
      </ConfirmModal>
    </section>
  );
}
