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
  /** Used to sort newest first */
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

/** Demo members you can pick as recipients */
export const commMembers: CommMember[] = [
  { id: 'm1', name: 'Madhu Sharma', email: 'madhu@midna.com', role: 'Admin' },
  { id: 'm2', name: 'Priya Nair', email: 'priya@midna.com', role: 'MLA Member' },
  { id: 'm3', name: 'Arjun Dev', email: 'arjun@midna.com', role: 'Counsellor' },
  { id: 'm4', name: 'Riya Saravanan', email: 'riya@midna.com', role: 'MLA Member' },
  { id: 'm5', name: 'Suresh Kumar', email: 'suresh@midna.com', role: 'Counsellor' },
  { id: 'm6', name: 'Lakshmi Venkat', email: 'lakshmi@midna.com', role: 'MLA Member' },
  { id: 'm7', name: 'Gopal Menon', email: 'gopal@midna.com', role: 'Senior Mentor' },
  { id: 'm8', name: 'Neha Gupta', email: 'neha@midna.com', role: 'Counsellor' },
];

const seedGroups: CommGroup[] = [
  { id: 'g1', name: 'Kerala MLAs', memberIds: ['m2', 'm6'] },
  { id: 'g2', name: 'HO Staff', memberIds: ['m1', 'm3', 'm5'] },
  { id: 'g3', name: 'All Counsellors', memberIds: ['m3', 'm5', 'm8'] },
];

const supplementalViewerPool = [
  { name: 'Vikram Iyer', role: 'MLA Member' },
  { name: 'Anita Rao', role: 'Counsellor' },
  { name: 'Deepak Nair', role: 'Senior Mentor' },
  { name: 'Kiran Patel', role: 'MLA Member' },
  { name: 'Sneha Reddy', role: 'Counsellor' },
  { name: 'Rahul Menon', role: 'MLA Member' },
  { name: 'Meera Krishnan', role: 'Admin' },
  { name: 'Ajith Babu', role: 'Counsellor' },
  { name: 'Divya Thomas', role: 'MLA Member' },
  { name: 'Sanjay Pillai', role: 'Senior Mentor' },
];

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function makeViewers(
  people: { id: string; name: string; role: string }[],
  seenAtTimes: string[]
): CommViewer[] {
  return people.map((person, index) => ({
    id: `v-${person.id}`,
    name: person.name,
    initials: initialsFor(person.name),
    role: person.role,
    seenAt: seenAtTimes[index] ?? seenAtTimes[seenAtTimes.length - 1] ?? '',
  }));
}

function sortRepliesNewestFirst(replies: CommReply[]): CommReply[] {
  return [...replies].sort((a, b) => b.createdAtMs - a.createdAtMs);
}

function sortCommunicationsNewestFirst(items: Communication[]): Communication[] {
  return [...items].sort((a, b) => b.createdAtMs - a.createdAtMs);
}

const seedCommunications: Communication[] = [
  {
    id: 'c1',
    title: 'Tomorrow is a Holiday!',
    body: 'Let us make a promise that we would not let the hard sacrifices of our brave freedom fighters go in vain. Happy Republic Day!',
    severity: 'low',
    author: 'HR Team',
    authorInitials: 'HR',
    createdAt: '14 Jan 2026 · 10:30 AM',
    createdAtMs: Date.parse('2026-01-14T10:30:00'),
    audienceMode: 'everyone',
    recipientIds: [],
    groupIds: [],
    groupNames: [],
    seenCount: 18,
    viewers: makeViewers(
      [
        ...commMembers.map((member) => ({ id: member.id, name: member.name, role: member.role })),
        ...supplementalViewerPool.slice(0, 10).map((person, index) => ({
          id: `x1-${index}`,
          name: person.name,
          role: person.role,
        })),
      ],
      [
        '14 Jan 2026 · 10:35 AM',
        '14 Jan 2026 · 10:42 AM',
        '14 Jan 2026 · 10:48 AM',
        '14 Jan 2026 · 11:02 AM',
        '14 Jan 2026 · 11:15 AM',
        '14 Jan 2026 · 11:28 AM',
        '14 Jan 2026 · 11:40 AM',
        '14 Jan 2026 · 12:05 PM',
        '14 Jan 2026 · 12:18 PM',
        '14 Jan 2026 · 12:30 PM',
        '14 Jan 2026 · 01:05 PM',
        '14 Jan 2026 · 01:22 PM',
        '14 Jan 2026 · 02:10 PM',
        '14 Jan 2026 · 02:45 PM',
        '14 Jan 2026 · 03:20 PM',
        '14 Jan 2026 · 04:00 PM',
        '14 Jan 2026 · 04:35 PM',
        '14 Jan 2026 · 05:10 PM',
      ]
    ),
    poll: null,
    replies: [
      {
        id: 'r1',
        author: 'Priya Nair',
        authorInitials: 'PN',
        body: 'Noted — wishing everyone a happy holiday!',
        createdAt: '14 Jan 2026 · 11:05 AM',
        createdAtMs: Date.parse('2026-01-14T11:05:00'),
      },
      {
        id: 'r2',
        author: 'Arjun Dev',
        authorInitials: 'AD',
        body: 'Thanks for the heads-up.',
        createdAt: '14 Jan 2026 · 11:40 AM',
        createdAtMs: Date.parse('2026-01-14T11:40:00'),
      },
    ],
  },
  {
    id: 'c2',
    title: 'System maintenance window',
    body: 'A brief maintenance window is planned this weekend. Dashboard access may be intermittent between 2:00 AM and 4:00 AM. Please plan scans accordingly.',
    severity: 'high',
    author: 'Ops Team',
    authorInitials: 'OT',
    createdAt: '02 Mar 2026 · 09:15 AM',
    createdAtMs: Date.parse('2026-03-02T09:15:00'),
    audienceMode: 'everyone',
    recipientIds: [],
    groupIds: [],
    groupNames: [],
    seenCount: 6,
    viewers: makeViewers(
      commMembers.slice(0, 6).map((member) => ({ id: member.id, name: member.name, role: member.role })),
      [
        '02 Mar 2026 · 09:20 AM',
        '02 Mar 2026 · 09:35 AM',
        '02 Mar 2026 · 09:48 AM',
        '02 Mar 2026 · 10:05 AM',
        '02 Mar 2026 · 10:22 AM',
        '02 Mar 2026 · 10:40 AM',
      ]
    ),
    poll: {
      question: 'Will you need weekend scan access?',
      options: [
        { id: 'p2a', label: 'Yes, please keep a backup window', votes: 4 },
        { id: 'p2b', label: 'No, I can wait until Monday', votes: 9 },
        { id: 'p2c', label: 'Not sure yet', votes: 2 },
      ],
    },
    replies: [
      {
        id: 'r3',
        author: 'Madhu Sharma',
        authorInitials: 'MS',
        body: 'Can we get a reminder 2 hours before it starts?',
        createdAt: '02 Mar 2026 · 10:02 AM',
        createdAtMs: Date.parse('2026-03-02T10:02:00'),
      },
    ],
  },
  {
    id: 'c3',
    title: 'New billing summary live',
    body: 'Your year-to-date and all-time billing figures are now reflected on the dashboard KPIs. Reach out to accounts if any number looks off.',
    severity: 'medium',
    author: 'Accounts',
    authorInitials: 'AC',
    createdAt: '01 Jul 2026 · 11:00 AM',
    createdAtMs: Date.parse('2026-07-01T11:00:00'),
    audienceMode: 'groups',
    recipientIds: ['m1', 'm3', 'm5'],
    groupIds: ['g2'],
    groupNames: ['HO Staff'],
    seenCount: 11,
    viewers: makeViewers(
      [
        ...commMembers.map((member) => ({ id: member.id, name: member.name, role: member.role })),
        ...supplementalViewerPool.slice(0, 3).map((person, index) => ({
          id: `x3-${index}`,
          name: person.name,
          role: person.role,
        })),
      ],
      [
        '01 Jul 2026 · 11:05 AM',
        '01 Jul 2026 · 11:12 AM',
        '01 Jul 2026 · 11:20 AM',
        '01 Jul 2026 · 11:35 AM',
        '01 Jul 2026 · 11:48 AM',
        '01 Jul 2026 · 12:05 PM',
        '01 Jul 2026 · 12:22 PM',
        '01 Jul 2026 · 12:40 PM',
        '01 Jul 2026 · 01:10 PM',
        '01 Jul 2026 · 01:35 PM',
        '01 Jul 2026 · 02:00 PM',
      ]
    ),
    poll: null,
    replies: [],
  },
];

type StoreState = {
  groups: CommGroup[];
  communications: Communication[];
};

let state: StoreState = {
  groups: [...seedGroups],
  communications: sortCommunicationsNewestFirst(seedCommunications),
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function sortCommunicationReplies(replies: CommReply[]): CommReply[] {
  return sortRepliesNewestFirst(replies);
}

export function getCommunicationsState(): StoreState {
  return state;
}

export function subscribeCommunications(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function formatCommDate(date = new Date()): string {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

export function publishCommunication(input: {
  title: string;
  body: string;
  severity: SeverityLevel;
  audienceMode: AudienceMode;
  recipientIds: string[];
  groupIds: string[];
  poll?: { question: string; options: string[] } | null;
}): Communication {
  const selectedGroups = state.groups.filter((g) => input.groupIds.includes(g.id));
  const recipientIds =
    input.audienceMode === 'groups'
      ? [...new Set(selectedGroups.flatMap((g) => g.memberIds))]
      : input.audienceMode === 'people'
        ? [...input.recipientIds]
        : [];

  const pollOptions = (input.poll?.options ?? [])
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 6);

  const poll: CommPoll | null =
    input.poll && input.poll.question.trim() && pollOptions.length >= 2
      ? {
          question: input.poll.question.trim(),
          options: pollOptions.map((label, index) => ({
            id: `opt-${Date.now()}-${index}`,
            label,
            votes: 0,
          })),
        }
      : null;

  const now = Date.now();
  const created: Communication = {
    id: `c-${now}`,
    title: input.title.trim(),
    body: input.body.trim(),
    severity: input.severity,
    author: 'You',
    authorInitials: 'YO',
    createdAt: formatCommDate(new Date(now)),
    createdAtMs: now,
    audienceMode: input.audienceMode,
    recipientIds,
    groupIds: selectedGroups.map((g) => g.id),
    groupNames: selectedGroups.map((g) => g.name),
    seenCount: 0,
    viewers: [],
    poll,
    replies: [],
  };

  state = {
    ...state,
    communications: sortCommunicationsNewestFirst([created, ...state.communications]),
  };
  emit();
  return created;
}

export function replyToCommunication(communicationId: string, body: string): CommReply | null {
  const text = body.trim();
  if (!text) return null;

  const now = Date.now();
  const reply: CommReply = {
    id: `r-${now}`,
    author: 'You',
    authorInitials: 'YO',
    body: text,
    createdAt: formatCommDate(new Date(now)),
    createdAtMs: now,
  };

  let found = false;
  state = {
    ...state,
    communications: state.communications.map((item) => {
      if (item.id !== communicationId) return item;
      found = true;
      return { ...item, replies: [...item.replies, reply] };
    }),
  };

  if (!found) return null;
  emit();
  return reply;
}

export function voteOnPoll(communicationId: string, optionId: string): void {
  state = {
    ...state,
    communications: state.communications.map((item) => {
      if (item.id !== communicationId || !item.poll) return item;
      return {
        ...item,
        poll: {
          ...item.poll,
          options: item.poll.options.map((option) =>
            option.id === optionId ? { ...option, votes: option.votes + 1 } : option
          ),
        },
      };
    }),
  };
  emit();
}

export function createGroup(name: string, memberIds: string[]): CommGroup {
  const group: CommGroup = {
    id: `g-${Date.now()}`,
    name: name.trim(),
    memberIds: [...memberIds],
  };
  state = {
    ...state,
    groups: [group, ...state.groups],
  };
  emit();
  return group;
}

export function deleteGroup(groupId: string): void {
  state = {
    ...state,
    groups: state.groups.filter((g) => g.id !== groupId),
  };
  emit();
}

export function getCommunicationById(id: string): Communication | undefined {
  return state.communications.find((item) => item.id === id);
}
