import { apiClient, apiUpload } from '../client';
import { demoProfile, isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type {
  Certification,
  ChangePasswordPayload,
  MemberProfile,
  MessageResponse,
  ProfileUpdatePayload,
} from '../types';

/** GET /api/profile/me — returns demo profile for frontend-only sessions */
export async function getMyProfile(signal?: AbortSignal): Promise<MemberProfile> {
  if (isDemoToken(getToken())) {
    return { ...demoProfile, city: 'Chennai', avatar_url: null };
  }
  return apiClient<MemberProfile>('/api/profile/me', { signal });
}

export async function updateMyProfile(body: ProfileUpdatePayload): Promise<MemberProfile> {
  if (isDemoToken(getToken())) {
    return { ...demoProfile, ...body, city: body.city ?? demoProfile.city ?? 'Chennai', avatar_url: null };
  }
  return apiClient<MemberProfile>('/api/profile/me', { method: 'PATCH', body });
}

export async function uploadAvatar(file: Blob, filename = 'avatar.jpg'): Promise<MemberProfile> {
  if (isDemoToken(getToken())) {
    return { ...demoProfile, city: 'Chennai', avatar_url: URL.createObjectURL(file) };
  }
  const formData = new FormData();
  formData.append('file', file, filename);
  return apiUpload<MemberProfile>('/api/profile/avatar', formData);
}

export async function getCertifications(signal?: AbortSignal): Promise<Certification[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<Certification[]>('/api/profile/certifications', { signal });
}

export async function uploadCertification(file: File): Promise<Certification> {
  if (isDemoToken(getToken())) {
    return {
      id: Date.now(),
      file_name: file.name,
      url: URL.createObjectURL(file),
      created_at: new Date().toISOString().slice(0, 10),
    };
  }
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload<Certification>('/api/profile/certifications', formData);
}

export async function deleteCertification(certId: number): Promise<void> {
  if (isDemoToken(getToken())) {
    return;
  }
  await apiClient<void>(`/api/profile/certifications/${certId}`, { method: 'DELETE' });
}

export async function changePassword(body: ChangePasswordPayload): Promise<MessageResponse> {
  if (isDemoToken(getToken())) {
    return { message: 'Password updated (demo mode)' };
  }
  return apiClient<MessageResponse>('/api/auth/change-password', { method: 'POST', body });
}
