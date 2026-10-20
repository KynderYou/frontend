import { apiClient } from '../client';
import type { StatusMaster, StatusMasterInput, StatusMasterList } from '../types';

/** GET /api/status-master — Super Admin full list */
export async function getStatusMaster(signal?: AbortSignal): Promise<StatusMasterList> {
  return apiClient<StatusMasterList>('/api/status-master', { signal });
}

/** GET /api/status-master/statuses — active statuses for dropdowns */
export async function getStatusTiers(signal?: AbortSignal): Promise<StatusMaster[]> {
  return apiClient<StatusMaster[]>('/api/status-master/statuses', { signal });
}

/** POST /api/status-master */
export async function createStatusMaster(body: StatusMasterInput): Promise<StatusMaster> {
  return apiClient<StatusMaster>('/api/status-master', { method: 'POST', body });
}

/** PUT /api/status-master/:id */
export async function updateStatusMaster(id: number, body: StatusMasterInput): Promise<StatusMaster> {
  return apiClient<StatusMaster>(`/api/status-master/${id}`, { method: 'PUT', body });
}

/** DELETE /api/status-master/:id */
export async function deleteStatusMaster(id: number): Promise<void> {
  await apiClient<void>(`/api/status-master/${id}`, { method: 'DELETE' });
}
