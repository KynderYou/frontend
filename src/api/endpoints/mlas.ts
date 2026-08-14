import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { MlaScanApi, MlasStateApi } from '../types';

/** GET /api/mlas/state — pass scope=mine for mentor MLA List */
export async function getMlasState(
  signal?: AbortSignal,
  scope?: 'mine',
): Promise<MlasStateApi> {
  if (isDemoToken(getToken())) {
    return { mentors: [], mlas: [] };
  }
  const query = scope === 'mine' ? '?scope=mine' : '';
  return apiClient<MlasStateApi>(`/api/mlas/state${query}`, { signal });
}

/** GET /api/mlas/{id}/scans */
export async function getMlaScans(mlaId: number, signal?: AbortSignal): Promise<MlaScanApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<MlaScanApi[]>(`/api/mlas/${mlaId}/scans`, { signal });
}
