import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type {
  CommunicationsStateApi,
  PublishCommunicationPayload,
} from '../types';

/** GET /api/communications/state */
export async function getCommunicationsState(signal?: AbortSignal): Promise<CommunicationsStateApi> {
  if (isDemoToken(getToken())) {
    return { groups: [], communications: [], members: [] };
  }
  return apiClient<CommunicationsStateApi>('/api/communications/state', { signal });
}

/** POST /api/communications/publish */
export async function publishCommunication(body: PublishCommunicationPayload): Promise<CommunicationsStateApi> {
  if (isDemoToken(getToken())) {
    throw new Error('Publish not available in demo mode');
  }
  return apiClient<CommunicationsStateApi>('/api/communications/publish', { method: 'POST', body });
}

/** POST /api/communications/{id}/replies */
export async function replyToCommunication(
  messageId: number,
  body: string,
): Promise<CommunicationsStateApi> {
  if (isDemoToken(getToken())) {
    throw new Error('Reply not available in demo mode');
  }
  return apiClient<CommunicationsStateApi>(`/api/communications/${messageId}/replies`, {
    method: 'POST',
    body: { body },
  });
}

/** POST /api/communications/{id}/poll-vote */
export async function voteOnPoll(messageId: number, optionId: number): Promise<CommunicationsStateApi> {
  if (isDemoToken(getToken())) {
    throw new Error('Vote not available in demo mode');
  }
  return apiClient<CommunicationsStateApi>(`/api/communications/${messageId}/poll-vote`, {
    method: 'POST',
    body: { option_id: optionId },
  });
}

/** POST /api/communications/groups */
export async function createCommGroup(
  name: string,
  memberIds: number[],
): Promise<CommunicationsStateApi> {
  if (isDemoToken(getToken())) {
    throw new Error('Create group not available in demo mode');
  }
  return apiClient<CommunicationsStateApi>('/api/communications/groups', {
    method: 'POST',
    body: { name, member_ids: memberIds },
  });
}

/** DELETE /api/communications/groups/{id} */
export async function deleteCommGroup(groupId: number): Promise<CommunicationsStateApi> {
  if (isDemoToken(getToken())) {
    throw new Error('Delete group not available in demo mode');
  }
  return apiClient<CommunicationsStateApi>(`/api/communications/groups/${groupId}`, { method: 'DELETE' });
}
