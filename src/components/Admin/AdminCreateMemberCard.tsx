import {
  createFormFilled,
  roleNeedsMentor,
  type AdminAccountFormState,
  type AdminMembershipFormState,
  type AdminVisibilityFormState,
  type MentorOption,
} from './adminProfileForm';
import { AdminAccountFields } from './AdminAccountFields';
import { AdminMembershipBillingFields } from './AdminMembershipBillingFields';
import { AdminReadOnlyNote } from './AdminReadOnlyNote';
import { AdminVisibilityAdminFields } from './AdminVisibilityAdminFields';

type AdminCreateMemberCardProps = {
  accountForm: AdminAccountFormState;
  membershipForm: AdminMembershipFormState;
  visibilityForm: AdminVisibilityFormState;
  mentors: MentorOption[];
  admins: MentorOption[];
  error: string | null;
  submitting: boolean;
  onAccountChange: (next: AdminAccountFormState) => void;
  onMembershipChange: (next: AdminMembershipFormState) => void;
  onVisibilityChange: (next: AdminVisibilityFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function AdminCreateMemberCard({
  accountForm,
  membershipForm,
  visibilityForm,
  mentors,
  admins,
  error,
  submitting,
  onAccountChange,
  onMembershipChange,
  onVisibilityChange,
  onSubmit,
}: AdminCreateMemberCardProps) {
  const isCounselor = accountForm.role === 'Counselor';
  const needsMentor = roleNeedsMentor(accountForm.role);
  const canSubmit = createFormFilled(accountForm, membershipForm);
  const mentorChoices = needsMentor ? mentors.filter((mentor) => mentor.role === 'Mentor') : mentors;

  return (
    <div className="dash-card" style={{ marginBottom: 16 }}>
      <div className="scans-card-head">
        <div>
          <h2 className="scans-card-title">Create account</h2>
          <p className="scans-card-sub">Account credentials plus admin-managed profile sections</p>
        </div>
        <span className="scans-card-meta">Admin only</span>
      </div>

      <form onSubmit={onSubmit}>
        <AdminAccountFields form={accountForm} onChange={onAccountChange} />
        <AdminMembershipBillingFields
          form={membershipForm}
          mentors={mentorChoices}
          onChange={onMembershipChange}
          counselorMode={isCounselor}
          mentorRequired={needsMentor}
          mlaMode={accountForm.role === 'MLA'}
          mlaTypeRequired
        />
        <AdminVisibilityAdminFields
          form={visibilityForm}
          onChange={onVisibilityChange}
          admins={admins}
          defaultToSelf
          hideAssignedAdmin={accountForm.role === 'Admin' || accountForm.role === 'Super Admin'}
        />
        <AdminReadOnlyNote />

        <div className="admin-create-footer">
          {error ? <p className="scans-upload-error" style={{ margin: 0 }}>{error}</p> : <span />}
          <button
            type="submit"
            className="btn-pill-primary"
            disabled={submitting || !canSubmit}
            title={canSubmit ? undefined : 'Fill the required fields to continue'}
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
}
