import { apiClient } from '../client';
import { demoDashboard } from '../demoDashboard';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { DashboardData } from '../types';

/** GET /api/dashboard/me */
export async function getDashboard(signal?: AbortSignal): Promise<DashboardData> {
  if (isDemoToken(getToken())) {
    return demoDashboard();
  }
  return apiClient<DashboardData>('/api/dashboard/me', { signal });
}
