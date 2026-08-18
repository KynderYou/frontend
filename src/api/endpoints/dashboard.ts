import { apiClient } from '../client';
import { demoDashboard, demoTopPerformers } from '../demoDashboard';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { DashboardData, TopPerformer } from '../types';

/** GET /api/dashboard/me */
export async function getDashboard(signal?: AbortSignal): Promise<DashboardData> {
  if (isDemoToken(getToken())) {
    return demoDashboard();
  }
  return apiClient<DashboardData>('/api/dashboard/me', { signal });
}

/** GET /api/dashboard/top-performers */
export async function getTopPerformers(signal?: AbortSignal): Promise<TopPerformer[]> {
  if (isDemoToken(getToken())) {
    return demoTopPerformers();
  }
  return apiClient<TopPerformer[]>('/api/dashboard/top-performers', { signal });
}
