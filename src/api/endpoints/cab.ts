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
