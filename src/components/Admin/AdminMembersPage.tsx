import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAdminMember,
  createTrainee,
  deleteAdminMember,
  deleteTrainee,
  getAdminMembers,
  getAdminMentors,
  getTraineesState,
} from '../../api';
import type { AdminMemberApi, TraineeApi } from '../../api/types';
import { EditTraineeModal } from '../Trainees/EditTraineeModal';
import { traineeErrorMessage } from '../Trainees/traineeForm';
import { colors, spacing, typography } from '../../styles/theme';
import { Skeleton, SkeletonTableCard } from '../common/Skeleton';
import { TablePager } from '../common/TablePager';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { useToast } from '../common/ToastProvider';
import { AdminCreateMemberCard } from './AdminCreateMemberCard';
import { AdminMemberProfileModal } from './AdminMemberProfileModal';
import { AdminMembersTable, type AdminAccountRow } from './AdminMembersTable';
import {
  emptyAccountForm,
  parseBillingDigits,
  emptyMembershipForm,
  emptyVisibilityForm,
  membershipFormToPayload,
  visibilityFormToPayload,
  type AdminAccountFormState,
  type AdminMembershipFormState,
  type AdminVisibilityFormState,
  type MentorOption,
} from './adminProfileForm';

const theme = colors.light;
const MEMBERS_PAGE_SIZE = 12;

type AdminMembersPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
  onNavigate?: (view: import('../Layout/navItems').AppView, target?: string) => void;
};

export function AdminMembersPage({ onOpenMobileMenu, onOpenProfile, onNavigate }: AdminMembersPageProps) {
  const { showSuccess, showError } = useToast();
  const [members, setMembers] = useState<AdminMemberApi[]>([]);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [accountForm, setAccountForm] = useState<AdminAccountFormState>(emptyAccountForm);
  const [membershipForm, setMembershipForm] = useState<AdminMembershipFormState>(emptyMembershipForm);
  const [visibilityForm, setVisibilityForm] = useState<AdminVisibilityFormState>(emptyVisibilityForm);
  const [editMember, setEditMember] = useState<AdminMemberApi | null>(null);
  const [trainees, setTrainees] = useState<TraineeApi[]>([]);
  const [editTrainee, setEditTrainee] = useState<TraineeApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPage = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [membersState, mentorsState, traineesState] = await Promise.all([
        getAdminMembers(signal),
        getAdminMentors(signal),
        getTraineesState(signal),
      ]);
      setMembers(membersState.members);
      setTrainees(traineesState.trainees);
      setMentors(
        mentorsState.mentors.map((mentor) => ({
          id: String(mentor.id),
          name: mentor.name,
          role: mentor.role,
        })),
      );
      setLoadError('');
    } catch {
      if (!signal?.aborted) setLoadError('Unable to load member accounts.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadPage(controller.signal);
    return () => controller.abort();
  }, [loadPage]);

  const rows = useMemo<AdminAccountRow[]>(
    () => [
      ...members.map((member) => ({ kind: 'member' as const, key: `m-${member.id}`, member })),
      ...trainees.map((trainee) => ({ kind: 'trainee' as const, key: `t-${trainee.id}`, trainee })),
    ],
    [members, trainees],
  );
  const membersPagination = useClientPagination(rows, MEMBERS_PAGE_SIZE, rows.length);

  const resetCreateForms = () => {
    setAccountForm(emptyAccountForm);
    setMembershipForm(emptyMembershipForm);
    setVisibilityForm(emptyVisibilityForm);
  };

  const handleCreateTrainee = async () => {
    const name = accountForm.name.trim();
    const email = accountForm.email.trim().toLowerCase();
    const phone = accountForm.phone.trim();

    if (!name || !phone) {
      setError('Enter the trainee name and phone number.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email or leave it blank.');
      return;
    }
    if (!membershipForm.mentoredById) {
      setError('Select the mentor this trainee works under.');
      return;
    }
    if (membershipForm.doj && membershipForm.expiryDate && membershipForm.expiryDate < membershipForm.doj) {
      setError('Expiry date must be after date of joining.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createTrainee({
        name,
        phone,
        email: email || undefined,
        mentor_id: Number(membershipForm.mentoredById),
        subscription: membershipForm.masType,
        billing_percent: Number(parseBillingDigits(membershipForm.billing) || 0),
        doj: membershipForm.doj || undefined,
        expiry_date: membershipForm.expiryDate || undefined,
        remarks: visibilityForm.remarks.trim() || undefined,
        status: 'Active',
      });
      setTrainees((current) => [result.trainee, ...current]);
      setError(null);
      resetCreateForms();
      showSuccess(`${result.trainee.name} saved as a trainee (no login created).`);
    } catch (err) {
      const message = traineeErrorMessage(err, 'Unable to save trainee.');
      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrainee = async (trainee: TraineeApi) => {
    if (!window.confirm(`Remove trainee ${trainee.name}? Their existing scans are kept.`)) return;
    try {
      const result = await deleteTrainee(trainee.id);
      setTrainees((current) => current.filter((row) => row.id !== result.id));
      showSuccess(result.message);
    } catch (err) {
      showError(traineeErrorMessage(err, `Unable to delete ${trainee.name}.`));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountForm.role === 'Trainee') {
      await handleCreateTrainee();
      return;
    }
    const name = accountForm.name.trim();
    const email = accountForm.email.trim().toLowerCase();
    const phone = accountForm.phone.trim();
    const password = accountForm.password;
    const role = accountForm.role;

    if (!name || !email || !phone || !password || !role) {
      setError('Fill all account fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createAdminMember({
        name,
        email,
        phone,
        password,
        role,
        ...membershipFormToPayload(membershipForm),
        ...visibilityFormToPayload(visibilityForm),
      });
      setMembers((current) => [result.member, ...current]);
      setError(null);
      resetCreateForms();
      showSuccess(result.message);
    } catch {
      const message = 'Unable to create account.';
      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (member: AdminMemberApi) => {
    try {
      const result = await deleteAdminMember(member.id);
      setMembers((current) => current.filter((row) => row.id !== result.id));
      showSuccess(result.message);
    } catch {
      showError(`Unable to delete ${member.name}.`);
    }
  };

  const handleProfileSaved = (member: AdminMemberApi) => {
    setMembers((current) => current.map((row) => (row.id === member.id ? member : row)));
    showSuccess(`Admin profile updated for ${member.name}.`);
  };

  if (loading) {
    return (
      <section className="page-section">
        <div className="page-header">
          <div className="page-title-block" style={{ minWidth: 0, flex: 1 }}>
            <h1 className="page-title" style={{ margin: 0, color: theme['text-primary'] }}>Member Accounts</h1>
          </div>
        </div>
        <div className="admin-members-layout" style={{ display: 'grid', gap: spacing[5] }}>
          <div className="dash-card" style={{ padding: spacing[5] }}>
            <Skeleton width={180} height={20} style={{ marginBottom: 20 }} />
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} width={`${90 - index * 5}%`} height={14} style={{ marginBottom: 14 }} />
            ))}
          </div>
          <SkeletonTableCard rows={10} columns={6} />
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page-section">
        <div className="dash-card" style={{ padding: spacing[5] }}>
          <p style={{ margin: 0, color: theme.error }}>{loadError}</p>
          <button type="button" className="btn-pill-secondary" style={{ marginTop: spacing[3] }} onClick={() => loadPage()}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <AdminMemberProfileModal
        open={editMember != null}
        member={editMember}
        mentors={mentors}
        onClose={() => setEditMember(null)}
        onSaved={handleProfileSaved}
      />

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
            Member Accounts
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            Admin registers membership, mentorship, and visibility · members fill the rest on profile
          </p>
        </div>

        <div className="page-header-actions">
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <NotificationButton onNavigate={onNavigate} />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      <AdminCreateMemberCard
        accountForm={accountForm}
        membershipForm={membershipForm}
        visibilityForm={visibilityForm}
        mentors={mentors}
        error={error}
        submitting={submitting}
        onAccountChange={setAccountForm}
        onMembershipChange={setMembershipForm}
        onVisibilityChange={setVisibilityForm}
        onSubmit={handleCreate}
      />

      <AdminMembersTable
        rows={membersPagination.pageItems}
        totalCount={membersPagination.total}
        rowOffset={(membersPagination.page - 1) * membersPagination.pageSize}
        onEdit={setEditMember}
        onDelete={handleDelete}
        onEditTrainee={setEditTrainee}
        onDeleteTrainee={handleDeleteTrainee}
      />
      <EditTraineeModal
        trainee={editTrainee}
        mentors={mentors.map((mentor) => ({ id: mentor.id, name: mentor.name }))}
        onClose={() => setEditTrainee(null)}
        onSaved={(saved, message) => {
          setTrainees((current) => current.map((row) => (row.id === saved.id ? saved : row)));
          showSuccess(message);
        }}
      />
      <TablePager
        page={membersPagination.page}
        pageSize={membersPagination.pageSize}
        total={membersPagination.total}
        onPageChange={membersPagination.setPage}
      />
    </section>
  );
}
