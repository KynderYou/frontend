import type { CommGroupApi, CommMemberApi, CommunicationApi, DashboardNotice } from '../../api/types';
import type { AudienceMode, CommGroup, CommMember, Communication } from './communicationsData';

function mapMember(member: CommMemberApi): CommMember {
  return {
    id: String(member.id),
    name: member.name,
    email: member.email,
    role: member.role,
  };
}

export function mapCommunication(item: CommunicationApi): Communication {
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

export function mapCommGroup(group: CommGroupApi): CommGroup {
  return {
    id: String(group.id),
    name: group.name,
    memberIds: group.member_ids.map(String),
  };
}

export function mapCommunicationsToDashboardNotices(communications: CommunicationApi[]): DashboardNotice[] {
  return communications.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    severity: item.severity as DashboardNotice['severity'],
    author_name: item.author,
    author_initials: item.author_initials,
    created_at: item.created_at,
    reply_count: item.replies.length,
    seen_count: item.seen_count,
    has_poll: item.poll !== null,
  }));
}

export function mapCommunicationsList(communications: CommunicationApi[]): Communication[] {
  return communications.map(mapCommunication);
}

export function mapCommGroups(groups: CommGroupApi[]): CommGroup[] {
  return groups.map(mapCommGroup);
}

export function mapCommMembers(members: CommMemberApi[]): CommMember[] {
  return members.map(mapMember);
}
