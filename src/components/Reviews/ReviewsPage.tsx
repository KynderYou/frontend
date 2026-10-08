import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuExternalLink, LuPlus } from 'react-icons/lu';
import midnaLogo from '../../assets/Midna logo.jpeg';
import { ApiError, createReview, deleteReview, getReviews } from '../../api';
import type { NewReview } from '../../api/endpoints/reviews';
import type { ReviewApi, ReviewKind } from '../../api/types';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { initials } from '../../utils/initials';
import { EmptyState } from '../common/EmptyState';
import { TablePager } from '../common/TablePager';
import { TrashButton } from '../common/TrashButton';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { useProtectedFile } from '../../hooks/useProtectedFile';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { AddReviewModal } from './AddReviewModal';
import { REVIEW_KIND_OPTIONS } from './reviewKinds';

const theme = colors.light;
const REVIEWS_PAGE_SIZE = 9;

type KindFilter = ReviewKind | 'all';

type ReviewsPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function apiErrorDetail(err: unknown, fallback: string) {
  const detail = err instanceof ApiError ? (err.body as { detail?: unknown } | null)?.detail : null;
  return typeof detail === 'string' ? detail : fallback;
}

function ReviewMedia({ review }: { review: ReviewApi }) {
  const src = useProtectedFile(review.file_url);
  if (!review.file_url) {
    return (
      <div className="review-media is-placeholder">
        <img src={midnaLogo} alt="Midna Global" />
      </div>
    );
  }
  if (!src) return <div className="review-media is-loading" aria-hidden="true" />;
  if (review.kind === 'audio' || review.file_mime?.startsWith('audio/')) {
    return <audio className="review-audio" controls preload="metadata" src={src} />;
  }
  return (
    <a className="review-media" href={src} target="_blank" rel="noopener noreferrer" title="Open picture">
      <img src={src} alt={`${review.kind_label} screenshot`} />
    </a>
  );
}

function ReviewCard({ review, onDelete }: { review: ReviewApi; onDelete: (review: ReviewApi) => void }) {
  const option = REVIEW_KIND_OPTIONS.find((o) => o.id === review.kind) ?? REVIEW_KIND_OPTIONS[3];
  return (
    <article className={`review-card tone-${option.tone}`}>
      <header className="review-card-head">
        <span className="review-kind-badge">
          {option.icon}
          {review.kind_label}
        </span>
        {review.can_delete ? <TrashButton label="Delete review" onClick={() => onDelete(review)} /> : null}
      </header>

      {review.client_name ? <h3 className="review-client">{review.client_name}</h3> : null}
      {review.caption ? <p className="review-caption">{review.caption}</p> : null}

      <ReviewMedia review={review} />

      {review.link ? (
        <a className="review-link" href={review.link} target="_blank" rel="noopener noreferrer">
          <LuExternalLink size={14} />
          Open review
        </a>
      ) : null}

      <footer className="review-card-foot">
        <span className="review-poster-avatar" aria-hidden="true">
          {initials(review.posted_by_name)}
        </span>
        <span className="review-poster">
          <strong>{review.posted_by_name}</strong>
          <span>
            {review.posted_by_role} · {review.posted_at}
          </span>
        </span>
      </footer>
    </article>
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((review) => {
      if (filter !== 'all' && review.kind !== filter) return false;
      if (!q) return true;
      return [review.client_name, review.caption, review.posted_by_name, review.kind_label]
        .some((value) => value.toLowerCase().includes(q));
    });
  }, [reviews, filter, query]);

  const pagination = useClientPagination(filtered, REVIEWS_PAGE_SIZE, `${filter}|${query}`);

  const handleAdd = async (review: NewReview) => {
    setSubmitting(true);
    setAddError('');
    try {
      const created = await createReview(review);
      setReviews((prev) => [created, ...prev]);
      setAddOpen(false);
      showSuccess(`${created.kind_label} posted.`);
    } catch (err) {
      setAddError(apiErrorDetail(err, 'Could not post the review. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (review: ReviewApi) => {
    if (!window.confirm(`Delete this ${review.kind_label.toLowerCase()}?`)) return;
    try {
      await deleteReview(review.id);
      setReviews((prev) => prev.filter((row) => row.id !== review.id));
      showSuccess('Review deleted.');
    } catch (err) {
      showError(apiErrorDetail(err, 'Could not delete the review.'));
    }
  };

  const countFor = (kind: KindFilter) => (kind === 'all' ? reviews.length : reviews.filter((r) => r.kind === kind).length);

  return (
    <section className="page-section reviews-page">
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
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
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
        <div className="reviews-grid" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="review-card is-skeleton" />
          ))}
        </div>
      ) : loadError ? (
        <div className="dash-card" style={{ padding: spacing[2] }}>
          <EmptyState title="Could not load reviews" description={loadError} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="dash-card" style={{ padding: spacing[2] }}>
          <EmptyState
            title={reviews.length === 0 ? 'No reviews yet' : 'No matching reviews'}
            description={
              reviews.length === 0
                ? 'Press + to add the first client review.'
                : 'Try another review type or search.'
            }
          />
        </div>
      ) : (
        <>
          <div className="reviews-grid">
            {pagination.pageItems.map((review) => (
              <ReviewCard key={review.id} review={review} onDelete={handleDelete} />
            ))}
          </div>
          <TablePager
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={pagination.setPage}
          />
        </>
      )}

      {addOpen ? (
        <AddReviewModal
          open
          onClose={() => setAddOpen(false)}
          onSubmit={handleAdd}
          submitting={submitting}
          error={addError}
        />
      ) : null}
    </section>
  );
}
