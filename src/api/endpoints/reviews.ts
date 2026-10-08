import { apiClient, apiUpload } from '../client';
import type { ReviewApi, ReviewKind } from '../types';

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
