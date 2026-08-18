import { apiClient } from '../client';
import { isDemoToken } from '../demoAuth';
import { getToken } from '../token';
import type {
  CommGroupApi,
  CommMemberApi,
  CommunicationApi,
  DeleteCommGroupResponse,
  PollVoteResultApi,
  PublishCommunicationPayload,
} from '../types';

/** GET /api/communications/notices */
export async function getCommunicationsNotices(signal?: AbortSignal): Promise<CommunicationApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<CommunicationApi[]>('/api/communications/notices', { signal });
}

/** GET /api/communications/groups */
export async function getCommGroups(signal?: AbortSignal): Promise<CommGroupApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<CommGroupApi[]>('/api/communications/groups', { signal });
}

/** GET /api/communications/members */
export async function getCommMembers(signal?: AbortSignal): Promise<CommMemberApi[]> {
  if (isDemoToken(getToken())) {
    return [];
  }
  return apiClient<CommMemberApi[]>('/api/communications/members', { signal });
}

/** POST /api/communications/publish */
export async function publishCommunication(body: PublishCommunicationPayload): Promise<CommunicationApi> {
  if (isDemoToken(getToken())) {
    throw new Error('Publish not available in demo mode');
  }
  return apiClient<CommunicationApi>('/api/communications/publish', { method: 'POST', body });
}

/** POST /api/communications/{id}/replies */
export async function replyToCommunication(
  messageId: number,
  body: string,
): Promise<CommunicationApi> {
  if (isDemoToken(getToken())) {
    throw new Error('Reply not available in demo mode');
  }
  return apiClient<CommunicationApi>(`/api/communications/${messageId}/replies`, {
    method: 'POST',
    body: { body },
  });
}

/** POST /api/communications/{id}/poll-vote */
export async function voteOnPoll(messageId: number, optionId: number): Promise<PollVoteResultApi> {
  if (isDemoToken(getToken())) {
    throw new Error('Vote not available in demo mode');
  }
  return apiClient<PollVoteResultApi>(`/api/communications/${messageId}/poll-vote`, {
    method: 'POST',
    body: { option_id: optionId },
  });
}

/** POST /api/communications/groups */
export async function createCommGroup(
  name: string,
  memberIds: number[],
): Promise<CommGroupApi> {
  if (isDemoToken(getToken())) {
    throw new Error('Create group not available in demo mode');
  }
  return apiClient<CommGroupApi>('/api/communications/groups', {
    method: 'POST',
    body: { name, member_ids: memberIds },
  });
}

/** DELETE /api/communications/groups/{id} */
export async function deleteCommGroup(groupId: number): Promise<DeleteCommGroupResponse> {
  if (isDemoToken(getToken())) {
    throw new Error('Delete group not available in demo mode');
  }
  return apiClient<DeleteCommGroupResponse>(`/api/communications/groups/${groupId}`, { method: 'DELETE' });
}
