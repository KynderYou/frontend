import { useMemo, useState, type ReactNode } from 'react';
import type { MentorRowApi, NetworkAdminApi } from '../../api/types';
import { colors, radius, spacing } from '../../styles/theme';
import { initials } from '../../utils/initials';
import type { MenteeNode, NetworkHierarchy } from '../Network/useNetworkHierarchy';

const theme = colors.light;
const UNASSIGNED = 'unassigned';

type MentorBranch = { mentor: MentorRowApi; mentees: MenteeNode[] };
type AdminBranch = { key: string; admin: NetworkAdminApi | null; mentors: MentorBranch[] };

type ReviewsPeopleTreeProps = {
  hierarchy: NetworkHierarchy;
  counts: Map<number, number>;
  total: number;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

type TreeRowProps = {
  top?: boolean;
  avatar: ReactNode;
  name: string;
  meta: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
  toggle?: { expanded: boolean; disabled: boolean; onToggle: () => void };
};

function TreeRow({ top, avatar, name, meta, count, selected, onSelect, toggle }: TreeRowProps) {
  const rowClass = top ? 'network-admin-row' : 'mentor-picker-row';
  return (
    <div className={`${rowClass}${selected ? ' is-selected' : ''}${toggle?.expanded ? ' is-expanded' : ''}`}>
      <button type="button" className="mentor-picker-main" aria-pressed={selected} aria-label={`Show reviews posted by ${name}`} onClick={onSelect}>
        <span className={top ? 'network-admin-avatar' : 'mentor-picker-avatar'} aria-hidden="true">
          {avatar}
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span className="mentor-picker-name">{name}</span>
          <span className="mentor-picker-meta">{meta}</span>
        </span>
        <span className={`reviews-tree-count${count === 0 ? ' is-zero' : ''}`} title={plural(count, 'review')}>
          {count}
        </span>
      </button>
      {toggle ? (
        <button
          type="button"
          className="network-admin-toggle"
          aria-label={`${toggle.expanded ? 'Hide' : 'Show'} people under ${name}`}
          aria-expanded={toggle.expanded}
          disabled={toggle.disabled}
          onClick={toggle.onToggle}
        >
          <Chevron />
        </button>
      ) : (
        <span className="reviews-tree-spacer" aria-hidden="true" />
      )}
    </div>
  );
}

/** Admin → mentor → counselor / MLA picker; choosing a person filters reviews to the ones they posted. */
export function ReviewsPeopleTree({ hierarchy, counts, total, selectedId, onSelect }: ReviewsPeopleTreeProps) {
  const [query, setQuery] = useState('');
  const [collapsedAdmins, setCollapsedAdmins] = useState<Set<string>>(() => new Set());
  const [openMentors, setOpenMentors] = useState<Set<number>>(() => new Set());

  const tree = useMemo<AdminBranch[]>(() => {
    const menteesByMentor = new Map<number, MenteeNode[]>();
    for (const mentee of hierarchy.mentees) {
      menteesByMentor.set(mentee.mentorId, [...(menteesByMentor.get(mentee.mentorId) ?? []), mentee]);
    }
    const branchesByAdmin = new Map<string, MentorBranch[]>();
    for (const mentor of hierarchy.mentors) {
      const key = mentor.admin_id ? String(mentor.admin_id) : UNASSIGNED;
      const branch = { mentor, mentees: menteesByMentor.get(mentor.id) ?? [] };
      branchesByAdmin.set(key, [...(branchesByAdmin.get(key) ?? []), branch]);
    }
    const list: AdminBranch[] = hierarchy.admins.map((admin) => ({
      key: String(admin.id),
      admin,
      mentors: branchesByAdmin.get(String(admin.id)) ?? [],
    }));
    const known = new Set(list.map((branch) => branch.key));
    const orphans = [...branchesByAdmin.entries()].filter(([key]) => !known.has(key)).flatMap(([, rows]) => rows);
    if (orphans.length > 0) list.push({ key: UNASSIGNED, admin: null, mentors: orphans });
    return list;
  }, [hierarchy]);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const visible = useMemo<AdminBranch[]>(() => {
    if (!q) return tree;
    const hit = (person: { name: string; email: string }) =>
      person.name.toLowerCase().includes(q) || person.email.toLowerCase().includes(q);
    return tree
      .map((branch) => {
        if (branch.admin && hit(branch.admin)) return branch;
        const mentors = branch.mentors
          .map((mb) => (hit(mb.mentor) ? mb : { ...mb, mentees: mb.mentees.filter(hit) }))
          .filter((mb) => hit(mb.mentor) || mb.mentees.length > 0);
        return { ...branch, mentors };
      })
      .filter((branch) => branch.mentors.length > 0 || (branch.admin && hit(branch.admin)));
  }, [tree, q]);

  const toggleAdmin = (key: string) =>
    setCollapsedAdmins((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleMentor = (id: number) =>
    setOpenMentors((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const countOf = (id: number) => counts.get(id) ?? 0;

  return (
    <div className="dash-card trainees-panel reviews-people-panel" style={{ padding: 0 }}>
      <div className="trainees-panel-header" style={{ padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${theme.divider}` }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>Posted by</h2>
        <p style={{ margin: '4px 0 12px', fontSize: 12, color: theme['text-muted'] }}>Admins, mentors and their counselors & MLAs</p>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: theme['bg-muted'],
            borderRadius: radius.md,
            padding: '8px 12px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme['text-muted']} strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            aria-label="Search people"
            className="reviews-search-input"
          />
        </label>
      </div>

      <div className="trainees-panel-scroll network-tree" aria-label="People">
        {searching ? null : (
          <TreeRow
            top
            avatar={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            name="Everyone"
            meta="All reviews across the network"
            count={total}
            selected={selectedId === null}
            onSelect={() => onSelect(null)}
          />
        )}

        {hierarchy.loading ? (
          <p className="network-admin-empty">Loading people…</p>
        ) : hierarchy.error ? (
          <p className="network-admin-empty">{hierarchy.error}</p>
        ) : visible.length === 0 ? (
          <p className="network-admin-empty">{searching ? 'No one matches your search.' : 'No admins or mentors yet.'}</p>
        ) : (
          visible.map((branch) => {
            const adminOpen = searching || !collapsedAdmins.has(branch.key);
            const admin = branch.admin;
            const adminName = admin?.name ?? 'Unassigned mentors';
            return (
              <div key={branch.key} className="network-admin-group">
                <TreeRow
                  top
                  avatar={admin ? initials(admin.name) : '?'}
                  name={adminName}
                  meta={admin ? `${admin.role} · ${plural(branch.mentors.length, 'mentor')}` : plural(branch.mentors.length, 'mentor')}
                  count={admin ? countOf(admin.id) : 0}
                  selected={admin !== null && selectedId === admin.id}
                  onSelect={() => (admin ? onSelect(admin.id) : toggleAdmin(branch.key))}
                  toggle={{ expanded: adminOpen, disabled: searching || branch.mentors.length === 0, onToggle: () => toggleAdmin(branch.key) }}
                />
                {adminOpen ? (
                  <div className="network-admin-children">
                    {branch.mentors.map(({ mentor, mentees }) => {
                      const mentorOpen = searching || openMentors.has(mentor.id);
                      return (
                        <div key={mentor.id} className="network-admin-group">
                          <TreeRow
                            avatar={initials(mentor.name)}
                            name={mentor.name}
                            meta={`Mentor · ${plural(mentor.trainee_count, 'counselor')} · ${plural(mentor.mla_count, 'MLA')}`}
                            count={countOf(mentor.id)}
                            selected={selectedId === mentor.id}
                            onSelect={() => onSelect(mentor.id)}
                            toggle={{ expanded: mentorOpen, disabled: searching || mentees.length === 0, onToggle: () => toggleMentor(mentor.id) }}
                          />
                          {mentorOpen && mentees.length > 0 ? (
                            <div className="network-admin-children">
                              {mentees.map((mentee) => (
                                <TreeRow
                                  key={`${mentee.type}-${mentee.id}`}
                                  avatar={initials(mentee.name)}
                                  name={mentee.name}
                                  meta={mentee.type}
                                  count={countOf(mentee.id)}
                                  selected={selectedId === mentee.id}
                                  onSelect={() => onSelect(mentee.id)}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                    {branch.mentors.length === 0 ? <p className="network-admin-empty">No mentors assigned to this admin yet.</p> : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
