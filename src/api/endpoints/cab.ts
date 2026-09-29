import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { CabStateApi } from '../types';

/** GET /api/cab/state — pass scope=mine for mentor-only CAB view */
export async function getCabState(signal?: AbortSignal, scope?: 'mine'): Promise<CabStateApi> {
  if (isDemoToken(getToken())) {
    return { mentors: [], records: [] };
  }
  const query = scope === 'mine' ? '?scope=mine' : '';
  return apiClient<CabStateApi>(`/api/cab/state${query}`, { signal });
}

/** POST /api/cab/{id}/debit */
export async function debitCabRecord(recordId: number, signal?: AbortSignal): Promise<CabStateApi> {
  return apiClient<CabStateApi>(`/api/cab/${recordId}/debit`, { method: 'POST', signal });
}

/** DELETE /api/cab/{id} — waive a pending CAB debit */
export async function deleteCabRecord(recordId: number): Promise<CabStateApi> {
  return apiClient<CabStateApi>(`/api/cab/${recordId}`, { method: 'DELETE' });
}

/** DELETE /api/cab/scans/{code}/request — decline a CAB request before upload */
export async function deleteCabRequest(scanCode: string): Promise<CabStateApi> {
  return apiClient<CabStateApi>(`/api/cab/scans/${encodeURIComponent(scanCode)}/request`, { method: 'DELETE' });
}

/** POST /api/cab/uploads/{id}/approve | reject — Admin only */
export async function reviewCabUpload(audioId: number, approve: boolean): Promise<CabStateApi> {
  return apiClient<CabStateApi>(`/api/cab/uploads/${audioId}/${approve ? 'approve' : 'reject'}`, { method: 'POST' });
}