import { apiClient } from '../client';
import type {
  AdminMembersStateApi,
  AdminMembershipFieldsPayload,
  AdminMentorsApi,
  AdminVisibilityFieldsPayload,
  CreateAdminMemberPayload,
  CreateAdminMemberResultApi,
  DeleteAdminMemberResultApi,
  ResetAdminMemberPasswordResultApi,
  UpdateAdminMembershipResultApi,
  UpdateAdminMemberStatusResultApi,
  UpdateAdminVisibilityResultApi,
} from '../types';

/** GET /api/admin/members */
export async function getAdminMembers(signal?: AbortSignal): Promise<AdminMembersStateApi> {
  return apiClient<AdminMembersStateApi>('/api/admin/members', { signal });
}

/** GET /api/admin/mentors */
export async function getAdminMentors(signal?: AbortSignal): Promise<AdminMentorsApi> {
  return apiClient<AdminMentorsApi>('/api/admin/mentors', { signal });
}

/** POST /api/admin/members */
export async function createAdminMember(
  payload: CreateAdminMemberPayload,
  signal?: AbortSignal,
): Promise<CreateAdminMemberResultApi> {
  return apiClient<CreateAdminMemberResultApi>('/api/admin/members', {
    method: 'POST',
    body: payload,
    signal,
  });
}

/** PATCH /api/admin/members/{id}/membership */
export async function updateAdminMemberMembership(
  memberId: number,
  payload: AdminMembershipFieldsPayload,
  signal?: AbortSignal,
): Promise<UpdateAdminMembershipResultApi> {
  return apiClient<UpdateAdminMembershipResultApi>(`/api/admin/members/${memberId}/membership`, {
    method: 'PATCH',
    body: payload,
    signal,
  });
}

/** PATCH /api/admin/members/{id}/visibility */
export async function updateAdminMemberVisibility(
  memberId: number,
  payload: AdminVisibilityFieldsPayload,
  signal?: AbortSignal,
): Promise<UpdateAdminVisibilityResultApi> {
  return apiClient<UpdateAdminVisibilityResultApi>(`/api/admin/members/${memberId}/visibility`, {
    method: 'PATCH',
    body: payload,
    signal,
  });
}

/** PATCH /api/admin/members/{id}/status */
export async function updateAdminMemberStatus(
  memberId: number,
  status: 'Active' | 'Invited' | 'Disabled',
  signal?: AbortSignal,
): Promise<UpdateAdminMemberStatusResultApi> {
  return apiClient<UpdateAdminMemberStatusResultApi>(`/api/admin/members/${memberId}/status`, {
    method: 'PATCH',
    body: { status },
    signal,
  });
}

/** POST /api/admin/members/{id}/reset-password */
export async function resetAdminMemberPassword(
  memberId: number,
  signal?: AbortSignal,
): Promise<ResetAdminMemberPasswordResultApi> {
  return apiClient<ResetAdminMemberPasswordResultApi>(`/api/admin/members/${memberId}/reset-password`, {
    method: 'POST',
    signal,
  });
}

/** DELETE /api/admin/members/{id} */
export async function deleteAdminMember(
  memberId: number,
  signal?: AbortSignal,
): Promise<DeleteAdminMemberResultApi> {
  return apiClient<DeleteAdminMemberResultApi>(`/api/admin/members/${memberId}`, {
    method: 'DELETE',
    signal,
  });
}
