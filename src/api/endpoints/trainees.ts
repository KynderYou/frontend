import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { TraineeScanApi, TraineesStateApi } from '../types';

/** GET /api/trainees/state */
export async function getTraineesState(signal?: AbortSignal): Promise<TraineesStateApi> {
  if (isDemoToken(getToken())) {
    return { mentors: [], trainees: [] };
  }
  return apiClient<TraineesStateApi>('/api/trainees/state', { signal });
}

/** GET /api/trainees/{id}/scans */
export async function getTraineeScans(traineeId: number, signal?: AbortSignal): Promise<TraineeScanApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<TraineeScanApi[]>(`/api/trainees/${traineeId}/scans`, { signal });
}
