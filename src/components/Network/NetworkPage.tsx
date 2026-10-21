import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAdminScans,
  getMentors,
  getMentorScans,
  getMlaScans,
  getMlasState,
  getNetworkAdmins,
  getTraineeScans,
  getTraineesState,
} from '../../api';
import type { MentorRowApi, NetworkAdminApi } from '../../api/types';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { LastScanCell } from '../common/LastScanCell';
import { MemberScansModal, type MemberScanRow } from '../common/MemberScansModal';
import { SkeletonMentorSplitPage } from '../common/Skeleton';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { mapMlaScans, mapMlasState } from '../Mlas/mlasApiMapper';
import { mapTraineeScans, mapTraineesState } from '../Trainees/traineesApiMapper';
import type { Trainee } from '../Trainees/traineesData';
import { initials } from '../../utils/initials';

const theme = colors.light;
const PAGE_SIZE = 8;

type MemberType = 'Counselor' | 'MLA';
type NetworkMember = Trainee & { type: MemberType };
type TypeFilter = 'All' | MemberType;
type StatusFilter = 'All' | 'Active' | 'Inactive';

const UNASSIGNED = 'unassigned';

type AdminGroup = { key: string; admin: NetworkAdminApi | null; mentors: MentorRowApi[] };

function adminKey(mentor: MentorRowApi) {
  return mentor.admin_id ? String(mentor.admin_id) : UNASSIGNED;
}

/** Whose scans the pop-up shows: an admin's or mentor's own uploads, or one counselor's / MLA's. */
type ScansTarget = {
  kind: 'admin' | 'mentor' | MemberType;
  id: number;
  name: string;
  email: string;
  scanCount: number;
};

type NetworkPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function statusStyles(status: string) {
  if (status === 'Active') return { color: theme.success, background: theme['success-bg'] };
  return { color: theme['text-muted'], background: theme['bg-muted'] };
}

function typeStyles(type: MemberType) {
  if (type === 'MLA') return { color: theme.primary, background: theme['primary-soft'] };
  return { color: theme.success, background: theme['success-bg'] };
}

function scanStatusStyles(status: string) {
  if (status === 'Exported' || status === 'Verified') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Processing') return { color: theme.warning, background: theme['warning-bg'] };
  return { color: theme.primary, background: theme['primary-soft'] };
}

const filterSelectStyle = {
  height: 36,
  borderRadius: radius.md,
  border: `1px solid ${theme.divider}`,
  background: theme['bg-surface'],
  color: theme['text-primary'],
  fontSize: 13,
  padding: '0 12px',
  fontFamily: 'inherit',
} as const;

function SearchBox({ value, onChange, placeholder, minWidth }: { value: string; onChange: (v: string) => void; placeholder: string; minWidth?: number }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: theme['bg-muted'],
        borderRadius: radius.md,
        padding: '8px 12px',
        minWidth,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme['text-muted']} strokeWidth="1.8">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 13,
          color: theme['text-primary'],
          width: '100%',
          fontFamily: 'inherit',
        }}
      />
    </label>
  );
}

export function NetworkPage({ onOpenMobileMenu, onOpenProfile }: NetworkPageProps) {
  const [admins, setAdmins] = useState<NetworkAdminApi[]>([]);
  const [mentors, setMentors] = useState<MentorRowApi[]>([]);
  const [members, setMembers] = useState<NetworkMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [mentorQuery, setMentorQuery] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);
  const [scansTarget, setScansTarget] = useState<ScansTarget | null>(null);

  const loadState = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [adminRows, mentorRows, traineesState, mlasState] = await Promise.all([
        getNetworkAdmins(signal),
        getMentors(signal),
        getTraineesState(signal),
        getMlasState(signal),
      ]);
      const counselors = mapTraineesState(traineesState).trainees.map((row) => ({ ...row, type: 'Counselor' as const }));
      const mlas = mapMlasState(mlasState).mlas.map((row) => ({ ...row, type: 'MLA' as const }));
      setAdmins(adminRows);
      setMentors(mentorRows);
      setMembers([...counselors, ...mlas].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedMentorId((current) => current ?? mentorRows[0]?.id ?? null);
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load your network.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadState(controller.signal);
    return () => controller.abort();
  }, [loadState]);

  const selectedMentor = mentors.find((mentor) => mentor.id === selectedMentorId);

  const groups = useMemo<AdminGroup[]>(() => {
    const byAdmin = new Map<string, MentorRowApi[]>();
    for (const mentor of mentors) {
      const key = adminKey(mentor);
      byAdmin.set(key, [...(byAdmin.get(key) ?? []), mentor]);
    }
    const list: AdminGroup[] = admins.map((admin) => ({
      key: String(admin.id),
      admin,
      mentors: byAdmin.get(String(admin.id)) ?? [],
    }));
    const known = new Set(list.map((g) => g.key));
    const orphans = [...byAdmin.entries()].filter(([key]) => !known.has(key)).flatMap(([, rows]) => rows);
    if (orphans.length > 0) list.push({ key: UNASSIGNED, admin: null, mentors: orphans });
    return list;
  }, [admins, mentors]);

  const searching = mentorQuery.trim().length > 0;

  const visibleGroups = useMemo<AdminGroup[]>(() => {
    const q = mentorQuery.trim().toLowerCase();
    if (!q) return groups;
    const matches = (name: string, email: string) => name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    return groups
      .map((group) => {
        if (group.admin && matches(group.admin.name, group.admin.email)) return group;
        return { ...group, mentors: group.mentors.filter((m) => matches(m.name, m.email)) };
      })
      .filter((group) => group.mentors.length > 0 || (group.admin && matches(group.admin.name, group.admin.email)));
  }, [groups, mentorQuery]);

  const toggleGroup = (key: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (m.mentorId !== String(selectedMentorId)) return false;
      if (typeFilter !== 'All' && m.type !== typeFilter) return false;
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [members, selectedMentorId, typeFilter, statusFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const showMentees = (id: number) => {
    setSelectedMentorId(id);
    setPage(1);
    setQuery('');
    setTypeFilter('All');
    setStatusFilter('All');
  };

  const header = (
    <div className="page-header">
      <div className="page-title-block" style={{ minWidth: 0, flex: 1 }}>
        <h1
          className="page-title"
          style={{
            margin: 0,
            fontSize: typography.roles.pageTitle.fontSize,
            lineHeight: typography.roles.pageTitle.lineHeight,
            fontWeight: typography.roles.pageTitle.fontWeight,
            letterSpacing: typography.roles.pageTitle.letterSpacing,
            color: theme['text-primary'],
          }}
        >
          Network
        </h1>
        <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 16, color: theme['text-secondary'] }}>
          Click an admin or mentor to see their own scans · use the arrows to open an admin's mentors and a mentor's counselors and MLAs.
        </p>
      </div>
      <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <NotificationButton />
        <ProfileAvatarButton onClick={onOpenProfile} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="page-section trainees-page">
        {header}
        <SkeletonMentorSplitPage />
      </section>
    );
  }

  if (loadError || (mentors.length === 0 && admins.length === 0)) {
    return (
      <section className="page-section trainees-page">
        {header}
        {loadError ? (
          <EmptyState title={loadError} description="Check your connection and try again." />
        ) : (
          <EmptyState title="No admins or mentors yet" description="Create accounts from Member Accounts." />
        )}
      </section>
    );
  }

  return (
    <section className="page-section trainees-page">
      {header}

      <div className="trainees-layout" style={{ gap: spacing[5] }}>
        <div className="dash-card trainees-panel" style={{ padding: 0 }}>
          <div className="trainees-panel-header" style={{ padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${theme.divider}` }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>Admins & mentors</h2>
            <p style={{ margin: '4px 0 12px', fontSize: 14, color: theme['text-muted'] }}>
              {admins.length} admin{admins.length === 1 ? '' : 's'} · {mentors.length} mentor{mentors.length === 1 ? '' : 's'}
            </p>
            <SearchBox value={mentorQuery} onChange={setMentorQuery} placeholder="Search admins & mentors" />
          </div>

          <div aria-label="Admins and mentors" className="trainees-panel-scroll network-tree">
            {visibleGroups.length === 0 ? (
              <p style={{ padding: spacing[5], margin: 0, fontSize: 14, color: theme['text-muted'], textAlign: 'center' }}>
                No admins or mentors match your search.
              </p>
            ) : (
              visibleGroups.map((group) => {
                const expanded = searching || !collapsed.has(group.key);
                const admin = group.admin;
                const groupName = admin?.name ?? 'Unassigned mentors';
                const mentorLabel = `${group.mentors.length} mentor${group.mentors.length === 1 ? '' : 's'}`;
                return (
                  <div key={group.key} className="network-admin-group">
                    <div className={`network-admin-row${expanded ? ' is-expanded' : ''}`}>
                      <button
                        type="button"
                        className="mentor-picker-main"
                        aria-label={admin ? `View scans uploaded by ${admin.name}` : `Show or hide ${groupName}`}
                        onClick={() =>
                          admin
                            ? setScansTarget({
                                kind: 'admin',
                                id: admin.id,
                                name: admin.name,
                                email: admin.email,
                                scanCount: admin.scan_count,
                              })
                            : toggleGroup(group.key)
                        }
                      >
                        <span className="network-admin-avatar" aria-hidden="true">
                          {admin ? initials(admin.name) : '?'}
                        </span>
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span className="mentor-picker-name">{groupName}</span>
                          <span className="mentor-picker-meta">
                            {admin ? `${admin.role} · ${mentorLabel} · ${admin.scan_count} scan${admin.scan_count === 1 ? '' : 's'}` : mentorLabel}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="network-admin-toggle"
                        aria-label={`${expanded ? 'Hide' : 'Show'} ${groupName}'s mentors`}
                        aria-expanded={expanded}
                        disabled={searching || group.mentors.length === 0}
                        onClick={() => toggleGroup(group.key)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                      </button>
                    </div>

                    {expanded ? (
                      <div className="network-admin-children">
                        {group.mentors.map((mentor) => {
                          const selected = mentor.id === selectedMentorId;
                          const menteeCount = mentor.trainee_count + mentor.mla_count;
                          return (
                            <div key={mentor.id} className={`mentor-picker-row is-nested${selected ? ' is-selected' : ''}`}>
                              <button
                                type="button"
                                className="mentor-picker-main"
                                aria-label={`View scans uploaded by ${mentor.name}`}
                                onClick={() =>
                                  setScansTarget({
                                    kind: 'mentor',
                                    id: mentor.id,
                                    name: mentor.name,
                                    email: mentor.email,
                                    scanCount: mentor.scan_count,
                                  })
                                }
                              >
                                <span className="mentor-picker-avatar" aria-hidden="true">
                                  {initials(mentor.name)}
                                </span>
                                <span style={{ minWidth: 0, flex: 1 }}>
                                  <span className="mentor-picker-name">{mentor.name}</span>
                                  <span className="mentor-picker-meta">
                                    {mentor.trainee_count} counselor{mentor.trainee_count === 1 ? '' : 's'} · {mentor.mla_count} MLA
                                    {mentor.mla_count === 1 ? '' : 's'}
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                className="mentor-picker-arrow"
                                aria-label={`Show ${mentor.name}'s counselors and MLAs (${menteeCount})`}
                                aria-pressed={selected}
                                onClick={() => showMentees(mentor.id)}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m9 6 6 6-6 6" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                        {group.mentors.length === 0 ? (
                          <p className="network-admin-empty">No mentors assigned to this admin yet.</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="dash-card trainees-table-panel" style={{ padding: 0, minWidth: 0 }}>
          <div
            className="trainees-table-toolbar"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing[4],
              padding: `${spacing[5]} ${spacing[6]}`,
              borderBottom: `1px solid ${theme.divider}`,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme['text-primary'] }}>
                {selectedMentor ? `${selectedMentor.name}'s counselors & MLAs` : 'Counselors & MLAs'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: theme['text-muted'] }}>
                {filtered.length} result{filtered.length === 1 ? '' : 's'}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <SearchBox
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                placeholder="Search counselors & MLAs"
                minWidth={200}
              />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as TypeFilter);
                  setPage(1);
                }}
                aria-label="Filter by type"
                style={filterSelectStyle}
              >
                <option value="All">Counselors & MLAs</option>
                <option value="Counselor">Counselors</option>
                <option value="MLA">MLAs</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(1);
                }}
                aria-label="Filter by status"
                style={filterSelectStyle}
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="trainees-table-body">
            <table className="mis-data-table trainees-data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th className="col-center">Type</th>
                  <th>DOJ</th>
                  <th className="col-center">Billing %</th>
                  <th className="col-center">Number of scans</th>
                  <th>Last scan</th>
                  <th>DOEx</th>
                  <th className="col-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr className="mis-data-empty">
                    <td colSpan={8}>No counselors or MLAs for this mentor.</td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <MemberRow
                      key={`${row.type}-${row.id}`}
                      member={row}
                      onOpen={() =>
                        setScansTarget({
                          kind: row.type,
                          id: Number(row.id),
                          name: row.name,
                          email: row.email,
                          scanCount: row.scanCount,
                        })
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            className="trainees-table-footer"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: `${spacing[4]} ${spacing[6]}`,
              borderTop: `1px solid ${theme.divider}`,
              fontSize: 14,
              color: theme['text-secondary'],
            }}
          >
            <span>
              {filtered.length === 0
                ? '0 members'
                : `${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn-pill-secondary"
                style={{ height: 32, fontSize: 12, padding: '6px 12px' }}
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-pill-secondary"
                style={{ height: 32, fontSize: 12, padding: '6px 12px' }}
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <NetworkScansModal target={scansTarget} onClose={() => setScansTarget(null)} />
    </section>
  );
}

function MemberRow({ member, onOpen }: { member: NetworkMember; onOpen: () => void }) {
  const tone = statusStyles(member.status);
  const typeTone = typeStyles(member.type);
  return (
    <tr
      className="mentor-trainee-row"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View scans for ${member.name}`}
      style={{ cursor: 'pointer' }}
    >
      <td data-label="Member">
        <div className="trainees-person">
          <span className="trainees-avatar" aria-hidden="true">
            {initials(member.name)}
          </span>
          <div>
            <div className="trainees-person-name">{member.name}</div>
            <div className="trainees-person-email">{member.email}</div>
          </div>
        </div>
      </td>
      <td data-label="Type" className="col-center">
        <span className="trainees-status" style={{ color: typeTone.color, background: typeTone.background }}>
          {member.type}
        </span>
      </td>
      <td data-label="DOJ">{member.doj}</td>
      <td data-label="Billing %" className="col-center">
        {member.billingPercent}%
      </td>
      <td data-label="Number of scans" className="col-center">
        {member.scanCount}
      </td>
      <td data-label="Last scan">
        <LastScanCell date={member.lastScan} days={member.lastScanDays} />
      </td>
      <td data-label="DOEx">{member.doex}</td>
      <td data-label="Status" className="col-center">
        <span className="trainees-status" style={{ color: tone.color, background: tone.background }}>
          {member.status}
        </span>
      </td>
    </tr>
  );
}

function loadScans(target: ScansTarget, signal: AbortSignal): Promise<MemberScanRow[]> {
  if (target.kind === 'admin') return getAdminScans(target.id, signal).then(mapMlaScans);
  if (target.kind === 'mentor') return getMentorScans(target.id, signal).then(mapMlaScans);
  if (target.kind === 'MLA') return getMlaScans(target.id, signal).then(mapMlaScans);
  return getTraineeScans(target.id, signal).then(mapTraineeScans);
}

function NetworkScansModal({ target, onClose }: { target: ScansTarget | null; onClose: () => void }) {
  const [scans, setScans] = useState<MemberScanRow[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    loadScans(target, controller.signal)
      .then((rows) => {
        setScans(rows);
        setScanError('');
      })
      .catch(() => {
        if (!controller.signal.aborted) setScanError('Unable to load scans.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingScans(false);
      });
    return () => {
      controller.abort();
      setScans([]);
      setLoadingScans(true);
    };
  }, [target]);

  const emptyMessage =
    target?.kind === 'admin'
      ? "This admin hasn't uploaded any scans yet."
      : target?.kind === 'mentor'
        ? "This mentor hasn't uploaded any scans themselves yet."
        : `No scans uploaded by this ${target?.kind === 'MLA' ? 'MLA' : 'counselor'} yet.`;

  return (
    <MemberScansModal
      open={Boolean(target)}
      onClose={onClose}
      titleId="network-scans-title"
      memberName={target?.name ?? ''}
      memberEmail={target?.email ?? ''}
      scanCount={target?.scanCount ?? 0}
      scans={scans}
      loading={loadingScans}
      error={scanError}
      emptyMessage={emptyMessage}
      statusStyle={scanStatusStyles}
    />
  );
}
