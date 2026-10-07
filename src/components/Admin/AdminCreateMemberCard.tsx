import type { AdminAccountFormState, AdminMembershipFormState, AdminVisibilityFormState, MentorOption } from './adminProfileForm';
import { colors, spacing } from '../../styles/theme';
import { AdminAccountFields } from './AdminAccountFields';
import { AdminMembershipBillingFields } from './AdminMembershipBillingFields';
import { AdminReadOnlyNote } from './AdminReadOnlyNote';
import { AdminVisibilityAdminFields } from './AdminVisibilityAdminFields';

const theme = colors.light;

type AdminCreateMemberCardProps = {
  accountForm: AdminAccountFormState;
  membershipForm: AdminMembershipFormState;
  visibilityForm: AdminVisibilityFormState;
  mentors: MentorOption[];
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
  error,
  submitting,
  onAccountChange,
  onMembershipChange,
  onVisibilityChange,
  onSubmit,
}: AdminCreateMemberCardProps) {
  const isTrainee = accountForm.role === 'Trainee';
  const isMla = accountForm.role === 'MLA';
  const mentorChoices = isTrainee || isMla ? mentors.filter((mentor) => mentor.role === 'Mentor') : mentors;

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
          traineeMode={isTrainee}
          mentorRequired={isMla}
        />
        {isTrainee ? (
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Remarks</h3>
            <div className="admin-create-grid">
              <label className="form-field admin-form-span-2">
                <span className="form-label">Remarks</span>
                <textarea
                  className="form-input form-textarea"
                  rows={2}
                  value={visibilityForm.remarks}
                  onChange={(e) => onVisibilityChange({ ...visibilityForm, remarks: e.target.value })}
                />
              </label>
            </div>
            <p style={{ margin: `${spacing[3]} 0 0`, fontSize: 12, color: theme['text-muted'] }}>
              Trainees don't sign in. Only their details are saved so mentors can pick them in Referred by.
            </p>
          </div>
        ) : (
          <>
            <AdminVisibilityAdminFields form={visibilityForm} onChange={onVisibilityChange} />
            <AdminReadOnlyNote />
          </>
        )}

        <div className="admin-create-footer">
          {error ? <p className="scans-upload-error" style={{ margin: 0 }}>{error}</p> : <span />}
          <button type="submit" className="btn-pill-primary" disabled={submitting}>
            {submitting ? (isTrainee ? 'Saving…' : 'Creating…') : isTrainee ? 'Save trainee' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
}
