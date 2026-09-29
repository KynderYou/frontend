import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { TraineeApi, TraineePayload, TraineeScanApi, TraineesStateApi } from '../types';

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
export async function createTrainee(payload: TraineePayload): Promise<{ trainee: TraineeApi; message: string }> {
  return apiClient('/api/trainees', {
    method: 'POST',
    body: payload,
  });
}

/** PATCH /api/trainees/{id} */
export async function updateTrainee(
  traineeId: number,
  payload: TraineePayload,
): Promise<{ trainee: TraineeApi; message: string }> {
  return apiClient(`/api/trainees/${traineeId}`, {
    method: 'PATCH',
    body: payload,
  });
}

/** DELETE /api/trainees/{id} */
export async function deleteTrainee(traineeId: number): Promise<{ id: number; message: string }> {
  return apiClient(`/api/trainees/${traineeId}`, { method: 'DELETE' });
}

/** GET /api/trainees/{id}/scans */
export async function getTraineeScans(traineeId: number, signal?: AbortSignal): Promise<TraineeScanApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<TraineeScanApi[]>(`/api/trainees/${traineeId}/scans`, { signal });
}
