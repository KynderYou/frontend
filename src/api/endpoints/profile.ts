import { apiClient } from '../client';
import { demoProfile, isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type { MemberProfile } from '../types';

/** GET /api/profile/me — returns demo profile for frontend-only sessions */
export async function getMyProfile(signal?: AbortSignal): Promise<MemberProfile> {
  if (isDemoToken(getToken())) {
    return demoProfile;
  }
  return apiClient<MemberProfile>('/api/profile/me', { signal });
}
