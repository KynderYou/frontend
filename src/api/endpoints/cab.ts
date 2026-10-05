import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { CabFeedbackApi, CabStateApi } from '../types';

/** GET /api/cab/state — Admin sees all feedback; mentors/mentees see their own */
export async function getCabState(signal?: AbortSignal): Promise<CabStateApi> {
  if (isDemoToken(getToken())) {
    return { feedback: [] };
  }
  return apiClient<CabStateApi>('/api/cab/state', { signal });
}

/** PUT /api/cab/scans/{code}/feedback — mentee rates the CAB their mentor sent */
export async function submitCabFeedback(scanCode: string, rating: number, comments: string): Promise<CabFeedbackApi> {
  return apiClient<CabFeedbackApi>(`/api/cab/scans/${encodeURIComponent(scanCode)}/feedback`, {
    method: 'PUT',
    body: { rating, comments },
  });
}

/** POST /api/cab/feedback/{id}/approve | reject — Admin only; approval credits the mentor */
export async function reviewCabFeedback(feedbackId: number, approve: boolean): Promise<CabStateApi> {
  return apiClient<CabStateApi>(`/api/cab/feedback/${feedbackId}/${approve ? 'approve' : 'reject'}`, { method: 'POST' });
}
