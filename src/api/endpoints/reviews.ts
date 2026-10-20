import { apiClient, apiUpload } from '../client';
import type { ReviewApi, ReviewDuplicateCheckApi, ReviewKind, ReviewRewardAmount, ReviewRewardsApi } from '../types';

export type NewReview = {
  kind: ReviewKind;
  link?: string;
  platform?: string;
  clientName?: string;
  caption?: string;
  file?: File | null;
};

/** GET /api/reviews — every member's reviews, newest first */
export async function getReviews(signal?: AbortSignal): Promise<ReviewApi[]> {
  return apiClient<ReviewApi[]>('/api/reviews', { signal });
}

/** POST /api/reviews — link, picture or MP3 depending on the review type */
export async function createReview(review: NewReview): Promise<ReviewApi> {
  const form = new FormData();
  form.append('kind', review.kind);
  form.append('link', review.link ?? '');
  form.append('platform', review.platform ?? '');
  form.append('client_name', review.clientName ?? '');
  form.append('caption', review.caption ?? '');
  if (review.file) form.append('file', review.file);
  return apiUpload<ReviewApi>('/api/reviews', form);
}

/** DELETE /api/reviews/:id — poster or Admin */
export async function deleteReview(id: number): Promise<void> {
  await apiClient<void>(`/api/reviews/${id}`, { method: 'DELETE' });
}

/** PUT /api/reviews/:id/reward — Admin records ₹50/100/150 (null clears); paid out annually, not a ledger credit */
export async function setReviewReward(id: number, amount: ReviewRewardAmount | null): Promise<ReviewApi> {
  return apiClient<ReviewApi>(`/api/reviews/${id}/reward`, {
    method: 'PUT',
    body: { amount },
  });
}

/** GET /api/reviews/rewards?year= — Super Admin yearly totals per member */
export async function getReviewRewards(year: number, signal?: AbortSignal): Promise<ReviewRewardsApi> {
  return apiClient<ReviewRewardsApi>(`/api/reviews/rewards?year=${year}`, { signal });
}

/** POST /api/reviews/check-duplicate — run before posting so duplicates stop before any upload */
export async function checkReviewDuplicate(
  payload: { link?: string; fileHash?: string | null },
  signal?: AbortSignal,
): Promise<ReviewDuplicateCheckApi> {
  return apiClient<ReviewDuplicateCheckApi>('/api/reviews/check-duplicate', {
    method: 'POST',
    body: { link: payload.link || null, file_hash: payload.fileHash || null },
    signal,
  });
}
