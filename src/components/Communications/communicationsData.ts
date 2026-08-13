import type { SeverityLevel } from '../../styles/theme';

export type AudienceMode = 'everyone' | 'people' | 'groups';

export type CommMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type CommGroup = {
  id: string;
  name: string;
  memberIds: string[];
};

export type CommReply = {
  id: string;
  author: string;
  authorInitials: string;
  body: string;
  createdAt: string;
  createdAtMs: number;
};

export type CommPollOption = {
  id: string;
  label: string;
  votes: number;
};

export type CommPoll = {
  question: string;
  options: CommPollOption[];
};

export type CommViewer = {
  id: string;
  name: string;
  initials: string;
  role: string;
  seenAt: string;
};

export type Communication = {
  id: string;
  title: string;
  body: string;
  severity: SeverityLevel;
  author: string;
  authorInitials: string;
  createdAt: string;
  createdAtMs: number;
  audienceMode: AudienceMode;
  recipientIds: string[];
  groupIds: string[];
  groupNames: string[];
  seenCount: number;
  viewers: CommViewer[];
  poll: CommPoll | null;
  replies: CommReply[];
};

export function sortCommunicationReplies(replies: CommReply[]): CommReply[] {
  return [...replies].sort((a, b) => b.createdAtMs - a.createdAtMs);
}

export function audienceLabel(item: Communication): string {
  if (item.audienceMode === 'everyone') return 'Everyone';
  if (item.audienceMode === 'groups') {
    if (item.groupNames.length === 0) return 'Groups';
    if (item.groupNames.length === 1) return `Group · ${item.groupNames[0]}`;
    return `${item.groupNames.length} groups · ${item.groupNames.join(', ')}`;
  }
  const n = item.recipientIds.length;
  return `${n} member${n === 1 ? '' : 's'}`;
}

export function pollTotalVotes(poll: CommPoll | null | undefined): number {
  if (!poll) return 0;
  return poll.options.reduce((sum, option) => sum + option.votes, 0);
}
