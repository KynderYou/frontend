import { useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

type HoverTip = { name: string; role: string; email?: string; detail?: string; count: number };
type TipState = { tip: HoverTip; top: number; left: number };
const TIP_WIDTH = 260;

type TreeRowProps = {
  top?: boolean;
  tip: HoverTip;
  onTip: (tip: HoverTip | null, el?: HTMLElement) => void;
  avatar: ReactNode;
  name: string;
  meta: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
  toggle?: { expanded: boolean; disabled: boolean; onToggle: () => void };
};

function TreeRow({ top, tip, onTip, avatar, name, meta, count, selected, onSelect, toggle }: TreeRowProps) {
  const rowClass = top ? 'network-admin-row' : 'mentor-picker-row is-nested';
  return (
    <div
      className={`${rowClass}${selected ? ' is-selected' : ''}${toggle?.expanded ? ' is-expanded' : ''}`}
      onMouseEnter={(e) => onTip(tip, e.currentTarget)}
      onMouseLeave={() => onTip(null)}
    >
      <button
        type="button"
        className="mentor-picker-main"
        aria-pressed={selected}
        aria-label={`Show reviews posted by ${name}`}
        onClick={onSelect}
        onFocus={(e) => onTip(tip, e.currentTarget.parentElement ?? e.currentTarget)}
        onBlur={() => onTip(null)}
      >
        <span className={top ? 'network-admin-avatar' : 'mentor-picker-avatar'} aria-hidden="true">
          {avatar}
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span className="mentor-picker-name">{name}</span>
          <span className="mentor-picker-meta">{`${meta} · ${plural(count, 'review')}`}</span>
        </span>
      </button>
      {toggle ? (
        <button
          type="button"
          className={top ? 'network-admin-toggle' : 'mentor-picker-arrow'}
          aria-label={`${toggle.expanded ? 'Hide' : 'Show'} people under ${name}`}
          aria-expanded={toggle.expanded}
          disabled={toggle.disabled}
          onClick={toggle.onToggle}
        >
          <Chevron />
        </button>
      ) : top ? null : (
        <span className="reviews-tree-spacer" aria-hidden="true" />
      )}
    </div>
  );
}

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

  const [tipState, setTipState] = useState<TipState | null>(null);
  const showTip = (tip: HoverTip | null, el?: HTMLElement) => {
    if (!tip || !el) {
      setTipState(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const fitsRight = rect.right + 12 + TIP_WIDTH <= window.innerWidth - 8;
    setTipState({
      tip,
      top: rect.top + rect.height / 2,
      left: fitsRight ? rect.right + 12 : Math.max(8, rect.left - 12 - TIP_WIDTH),
    });
  };

  return (
    <div className="dash-card trainees-panel" style={{ padding: 0 }}>
      <div className="trainees-panel-header" style={{ padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${theme.divider}` }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>Posted by</h2>
        <p style={{ margin: '4px 0 12px', fontSize: 12, color: theme['text-muted'] }}>
          {plural(hierarchy.admins.length, 'admin')} · {plural(hierarchy.mentors.length, 'mentor')} · {plural(total, 'review')}
        </p>
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

      <div className="trainees-panel-scroll network-tree reviews-tree" aria-label="People" onScroll={() => setTipState(null)}>

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
                  tip={{
                    name: adminName,
                    role: admin?.role ?? 'Unassigned',
                    email: admin?.email,
                    detail: plural(branch.mentors.length, 'mentor'),
                    count: admin ? countOf(admin.id) : 0,
                  }}
                  onTip={showTip}
                  avatar={admin ? initials(admin.name) : '?'}
                  name={adminName}
                  meta={admin ? `${admin.role} · ${plural(branch.mentors.length, 'mentor')}` : plural(branch.mentors.length, 'mentor')}
                  count={admin ? countOf(admin.id) : 0}
                  selected={admin !== null && selectedId === admin.id}
                  onSelect={() => (admin ? onSelect(selectedId === admin.id ? null : admin.id) : toggleAdmin(branch.key))}
                  toggle={{ expanded: adminOpen, disabled: searching || branch.mentors.length === 0, onToggle: () => toggleAdmin(branch.key) }}
                />
                {adminOpen ? (
                  <div className="network-admin-children">
                    {branch.mentors.map(({ mentor, mentees }) => {
                      const mentorOpen = searching || openMentors.has(mentor.id);
                      return (
                        <div key={mentor.id} className="network-admin-group">
                          <TreeRow
                            tip={{
                              name: mentor.name,
                              role: 'Mentor',
                              email: mentor.email,
                              detail: `${plural(mentor.trainee_count, 'counselor')} · ${plural(mentor.mla_count, 'MLA')}`,
                              count: countOf(mentor.id),
                            }}
                            onTip={showTip}
                            avatar={initials(mentor.name)}
                            name={mentor.name}
                            meta={`${plural(mentor.trainee_count, 'counselor')} · ${plural(mentor.mla_count, 'MLA')}`}
                            count={countOf(mentor.id)}
                            selected={selectedId === mentor.id}
                            onSelect={() => onSelect(selectedId === mentor.id ? null : mentor.id)}
                            toggle={{ expanded: mentorOpen, disabled: searching || mentees.length === 0, onToggle: () => toggleMentor(mentor.id) }}
                          />
                          {mentorOpen && mentees.length > 0 ? (
                            <div className="network-admin-children">
                              {mentees.map((mentee) => (
                                <TreeRow
                                  key={`${mentee.type}-${mentee.id}`}
                                  tip={{
                                    name: mentee.name,
                                    role: mentee.type,
                                    email: mentee.email,
                                    detail: `Under ${mentor.name}`,
                                    count: countOf(mentee.id),
                                  }}
                                  onTip={showTip}
                                  avatar={initials(mentee.name)}
                                  name={mentee.name}
                                  meta={mentee.type}
                                  count={countOf(mentee.id)}
                                  selected={selectedId === mentee.id}
                                  onSelect={() => onSelect(selectedId === mentee.id ? null : mentee.id)}
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
      {tipState
        ? createPortal(
            <div
              className="tree-hover-card"
              role="tooltip"
              style={{ top: tipState.top, left: tipState.left, width: TIP_WIDTH }}
            >
              <div className="tree-hover-card-head">
                <strong>{tipState.tip.name}</strong>
                <span className="tree-hover-card-role">{tipState.tip.role}</span>
              </div>
              {tipState.tip.email ? <span className="tree-hover-card-email">{tipState.tip.email}</span> : null}
              {tipState.tip.detail ? <span className="tree-hover-card-detail">{tipState.tip.detail}</span> : null}
              <span className="tree-hover-card-count">{plural(tipState.tip.count, 'review')} posted</span>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
