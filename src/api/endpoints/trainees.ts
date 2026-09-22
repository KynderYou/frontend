import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { TraineeApi, TraineeScanApi, TraineesStateApi } from '../types';

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

/** POST /api/trainees — admin adds directory trainee details (not a login user) */
export async function createTrainee(payload: {
  name: string;
  mentor_id: number;
  phone?: string;
  email?: string;
  doj?: string;
  status?: string;
}): Promise<{ trainee: TraineeApi; message: string }> {
  return apiClient('/api/trainees', {
    method: 'POST',
    body: payload,
  });
}

/** GET /api/trainees/{id}/scans */
export async function getTraineeScans(traineeId: number, signal?: AbortSignal): Promise<TraineeScanApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<TraineeScanApi[]>(`/api/trainees/${traineeId}/scans`, { signal });
}
