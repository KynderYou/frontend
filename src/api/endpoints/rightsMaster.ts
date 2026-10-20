import { apiClient } from '../client';
import type { RightsMaster, RightsMasterInput, RightsMasterList } from '../types';

/** GET /api/rights-master — Super Admin full list */
export async function getRightsMaster(signal?: AbortSignal): Promise<RightsMasterList> {
  return apiClient<RightsMasterList>('/api/rights-master', { signal });
}

/** GET /api/rights-master/tiers — active tiers for dropdowns */
export async function getRightsTiers(signal?: AbortSignal): Promise<RightsMaster[]> {
  return apiClient<RightsMaster[]>('/api/rights-master/tiers', { signal });
}

/** POST /api/rights-master */
export async function createRightsMaster(body: RightsMasterInput): Promise<RightsMaster> {
  return apiClient<RightsMaster>('/api/rights-master', { method: 'POST', body });
}

/** PUT /api/rights-master/:id */
export async function updateRightsMaster(id: number, body: RightsMasterInput): Promise<RightsMaster> {
  return apiClient<RightsMaster>(`/api/rights-master/${id}`, { method: 'PUT', body });
}

/** DELETE /api/rights-master/:id */
export async function deleteRightsMaster(id: number): Promise<void> {
  await apiClient<void>(`/api/rights-master/${id}`, { method: 'DELETE' });
}
