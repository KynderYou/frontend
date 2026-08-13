import type { CommunicationsStateApi } from '../../api/types';
import type { AudienceMode, CommGroup, CommMember, Communication } from './communicationsData';

function mapMember(member: CommunicationsStateApi['members'][number]): CommMember {
  return {
    id: String(member.id),
    name: member.name,
    email: member.email,
    role: member.role,
  };
}

function mapCommunication(item: CommunicationsStateApi['communications'][number]): Communication {
  return {
    id: String(item.id),
    title: item.title,
    body: item.body,
    severity: item.severity as Communication['severity'],
    author: item.author,
    authorInitials: item.author_initials,
    createdAt: item.created_at,
    createdAtMs: item.created_at_ms,
    audienceMode: item.audience_mode as AudienceMode,
    recipientIds: item.recipient_ids.map(String),
    groupIds: item.group_ids.map(String),
    groupNames: item.group_names,
    seenCount: item.seen_count,
    viewers: item.viewers.map((viewer) => ({
      id: viewer.id,
      name: viewer.name,
      initials: viewer.initials,
      role: viewer.role,
      seenAt: viewer.seen_at,
    })),
    poll: item.poll
      ? {
          question: item.poll.question,
          options: item.poll.options.map((option) => ({
            id: String(option.id),
            label: option.label,
            votes: option.votes,
          })),
        }
      : null,
    replies: item.replies.map((reply) => ({
      id: String(reply.id),
      author: reply.author,
      authorInitials: reply.author_initials,
      body: reply.body,
      createdAt: reply.created_at,
      createdAtMs: reply.created_at_ms,
    })),
  };
}

export function mapCommunicationsState(state: CommunicationsStateApi): {
  groups: CommGroup[];
  communications: Communication[];
  members: CommMember[];
} {
  return {
    groups: state.groups.map((group) => ({
      id: String(group.id),
      name: group.name,
      memberIds: group.member_ids.map(String),
    })),
    communications: state.communications.map(mapCommunication),
    members: state.members.map(mapMember),
  };
}
