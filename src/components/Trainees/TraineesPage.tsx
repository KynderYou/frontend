import { useMemo, useState } from 'react';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import {
  mentors,
  trainees,
  traineeCountFor,
  type Mentor,
  type Trainee,
  type TraineeStatus,
} from './traineesData';

const theme = colors.light;
const PAGE_SIZE = 5;

type TraineesPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function statusStyles(status: TraineeStatus) {
  if (status === 'Active') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Pending') return { color: theme.warning, background: theme['warning-bg'] };
  return { color: theme['text-muted'], background: theme['bg-muted'] };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function TraineesPage({ onOpenMobileMenu, onOpenProfile }: TraineesPageProps) {
  const [selectedMentorId, setSelectedMentorId] = useState<string>(mentors[0]?.id ?? '');
  const [mentorQuery, setMentorQuery] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TraineeStatus>('All');
  const [page, setPage] = useState(1);

  const selectedMentor: Mentor | undefined = mentors.find((m) => m.id === selectedMentorId);

  const filteredMentors = useMemo(() => {
    const q = mentorQuery.trim().toLowerCase();
    if (!q) return mentors;
    return mentors.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    );
  }, [mentorQuery]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trainees.filter((t) => {
      if (t.mentorId !== selectedMentorId) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q)
      );
    });
  }, [selectedMentorId, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectMentor = (id: string) => {
    setSelectedMentorId(id);
    setPage(1);
    setQuery('');
    setStatusFilter('All');
  };

  return (
    <section className="page-section trainees-page">
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
            My Trainees
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Search a mentor, then manage their trainees.
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <button type="button" className="btn-pill-primary" style={{ height: 36, fontSize: 13, padding: '8px 14px' }}>
            + Add trainee
          </button>
          <NotificationButton />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      <div className="trainees-layout" style={{ gap: spacing[5] }}>
        {/* Searchable mentor list — scales to 50+ mentors */}
        <div className="dash-card trainees-panel" style={{ padding: 0 }}>
          <div className="trainees-panel-header" style={{ padding: `${spacing[4]} ${spacing[5]}`, borderBottom: `1px solid ${theme.divider}` }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>Mentors</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: theme['text-muted'] }}>
              {filteredMentors.length} of {mentors.length}
            </p>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: theme['bg-muted'],
                borderRadius: radius.md,
                padding: '8px 12px',
                marginTop: spacing[3],
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme['text-muted']} strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={mentorQuery}
                onChange={(e) => setMentorQuery(e.target.value)}
                placeholder="Search mentors"
                aria-label="Search mentors"
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
          </div>

          <div role="listbox" aria-label="Mentors" className="trainees-panel-scroll">
            {filteredMentors.length === 0 ? (
              <p style={{ padding: spacing[5], margin: 0, fontSize: 13, color: theme['text-muted'], textAlign: 'center' }}>
                No mentors match your search.
              </p>
            ) : (
              filteredMentors.map((mentor) => {
                const count = traineeCountFor(mentor.id);
                const selected = mentor.id === selectedMentorId;
                return (
                  <button
                    key={mentor.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectMentor(mentor.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: `${spacing[3]} ${spacing[5]}`,
                      border: 'none',
                      borderBottom: `1px solid ${theme.divider}`,
                      background: selected ? theme['primary-soft'] : theme['bg-surface'],
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      color: 'inherit',
                      borderLeft: selected ? `3px solid ${theme.primary}` : '3px solid transparent',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: selected ? theme.primary : theme['bg-muted'],
                        color: selected ? '#fff' : theme.primary,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {initials(mentor.name)}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: theme['text-primary'],
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {mentor.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: theme['text-muted'],
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {mentor.region}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: theme.primary,
                        background: theme['bg-surface'],
                        borderRadius: radius.pill,
                        padding: '3px 8px',
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Trainees table for selected mentor */}
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
                {selectedMentor ? `${selectedMentor.name}'s trainees` : 'Trainees'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: theme['text-muted'] }}>
                {filtered.length} result{filtered.length === 1 ? '' : 's'}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: theme['bg-muted'],
                  borderRadius: radius.md,
                  padding: '8px 12px',
                  minWidth: 180,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme['text-muted']} strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search trainees"
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

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'All' | TraineeStatus);
                  setPage(1);
                }}
                aria-label="Filter by status"
                style={{
                  height: 36,
                  borderRadius: radius.md,
                  border: `1px solid ${theme.divider}`,
                  background: theme['bg-surface'],
                  color: theme['text-primary'],
                  fontSize: 13,
                  padding: '0 12px',
                  fontFamily: 'inherit',
                }}
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="trainees-table-body">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: 12, color: theme['text-muted'] }}>
                  <th style={{ padding: '14px 24px', fontWeight: 600 }}>Trainee</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Last active</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '14px 24px', fontWeight: 600, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: theme['text-muted'], fontSize: 14 }}>
                      No trainees for this mentor.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => <TraineeRow key={row.id} trainee={row} />)
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
              fontSize: 13,
              color: theme['text-secondary'],
            }}
          >
            <span>
              {filtered.length === 0
                ? '0 trainees'
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
    </section>
  );
}

function TraineeRow({ trainee }: { trainee: Trainee }) {
  const tone = statusStyles(trainee.status);
  return (
    <tr style={{ borderTop: `1px dashed ${theme.divider}` }}>
      <td style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: theme['primary-soft'],
              color: theme.primary,
              display: 'grid',
              placeItems: 'center',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials(trainee.name)}
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme['text-primary'] }}>{trainee.name}</div>
            <div style={{ fontSize: 12, color: theme['text-muted'], marginTop: 2 }}>{trainee.email}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '16px 16px', fontSize: 13, color: theme['text-secondary'] }}>{trainee.lastActive}</td>
      <td style={{ padding: '16px 16px', textAlign: 'center' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: tone.color,
            background: tone.background,
            borderRadius: radius.pill,
            padding: '4px 10px',
          }}
        >
          {trainee.status}
        </span>
      </td>
      <td style={{ padding: '16px 16px', fontSize: 13, color: theme['text-secondary'] }}>{trainee.role}</td>
      <td style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button type="button" className="btn-icon" aria-label={`More actions for ${trainee.name}`} style={{ width: 32, height: 32 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />
            </svg>
          </button>
          <button type="button" className="btn-pill-secondary" style={{ height: 32, fontSize: 12, padding: '6px 12px' }}>
            Manage
          </button>
        </div>
      </td>
    </tr>
  );
}
