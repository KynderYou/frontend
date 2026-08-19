import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { ReportRecordApi } from '../types';

/** GET /api/reports/me */
export async function getMyReports(signal?: AbortSignal): Promise<ReportRecordApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<ReportRecordApi[]>('/api/reports/me', { signal });
}

/** POST /api/reports/{id}/upgrade */
export async function upgradeReport(scanId: number): Promise<ReportRecordApi> {
  if (isDemoToken(getToken())) {
    throw new Error('Upgrade not available in demo mode');
  }
  return apiClient<ReportRecordApi>(`/api/reports/${scanId}/upgrade`, { method: 'POST' });
}

/** POST /api/reports/{id}/cab-request */
export async function requestReportCab(scanId: number): Promise<ReportRecordApi> {
  if (isDemoToken(getToken())) {
    throw new Error('CAB request not available in demo mode');
  }
  return apiClient<ReportRecordApi>(`/api/reports/${scanId}/cab-request`, { method: 'POST' });
}

/** DELETE /api/reports/{id} */
export async function deleteReport(scanId: number): Promise<{ message: string }> {
  if (isDemoToken(getToken())) {
    return { message: `Report ${scanId} deleted.` };
  }
  return apiClient<{ message: string }>(`/api/reports/${scanId}`, { method: 'DELETE' });
}
