import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { MentorRowApi, MlaScanApi, MlasStateApi, NetworkAdminApi } from '../types';

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

/** GET /api/mentors — Admin list of mentors; scan figures count only scans the mentor uploaded */
export async function getMentors(signal?: AbortSignal): Promise<MentorRowApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<MentorRowApi[]>('/api/mentors', { signal });
}

/** GET /api/mentors/{id}/scans — scans uploaded by the mentor themselves */
export async function getMentorScans(mentorId: number, signal?: AbortSignal): Promise<MlaScanApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<MlaScanApi[]>(`/api/mentors/${mentorId}/scans`, { signal });
}

/** GET /api/mentors/admins — admins for the Network tree; scan figures count only scans the admin uploaded */
export async function getNetworkAdmins(signal?: AbortSignal): Promise<NetworkAdminApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<NetworkAdminApi[]>('/api/mentors/admins', { signal });
}

/** GET /api/mentors/admins/{id}/scans — scans uploaded by the admin themselves */
export async function getAdminScans(adminId: number, signal?: AbortSignal): Promise<MlaScanApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<MlaScanApi[]>(`/api/mentors/admins/${adminId}/scans`, { signal });
}
