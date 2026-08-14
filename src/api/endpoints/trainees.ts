import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { TraineeScanApi, TraineesStateApi } from '../types';

/** GET /api/trainees/state — pass scope=mine for mentor Trainee List */
export async function getTraineesState(
  signal?: AbortSignal,
  scope?: 'mine',
): Promise<TraineesStateApi> {
  if (isDemoToken(getToken())) {
    return { mentors: [], trainees: [] };
  }
  const query = scope === 'mine' ? '?scope=mine' : '';
  return apiClient<TraineesStateApi>(`/api/trainees/state${query}`, { signal });
}

/** GET /api/trainees/{id}/scans */
export async function getTraineeScans(traineeId: number, signal?: AbortSignal): Promise<TraineeScanApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<TraineeScanApi[]>(`/api/trainees/${traineeId}/scans`, { signal });
}
