import type { AdminMembershipFormState, MentorOption } from './adminProfileForm';
import { subscriptionTierOptions, tierBilling } from './adminProfileForm';
import { BillingSlabField } from './BillingSlabField';

type AdminMembershipBillingFieldsProps = {
  form: AdminMembershipFormState;
  mentors: MentorOption[];
  onChange: (next: AdminMembershipFormState) => void;
  traineeMode?: boolean;
  mentorRequired?: boolean;
};

export function AdminMembershipBillingFields({
  form,
  mentors,
  onChange,
  traineeMode = false,
  mentorRequired = false,
}: AdminMembershipBillingFieldsProps) {
  const needsMentor = traineeMode || mentorRequired;
  const update = <K extends keyof AdminMembershipFormState>(key: K, value: AdminMembershipFormState[K]) => {
    onChange({ ...form, [key]: value });
  };

  const handleTierChange = (tier: AdminMembershipFormState['masType']) => {
    onChange({
      ...form,
      masType: tier,
      billing: tierBilling[tier],
    });
  };

  return (
    <div className="admin-form-section">
      <h3 className="admin-form-section-title">Membership &amp; billing</h3>
      <p className="admin-form-section-sub">
        {traineeMode
          ? 'Trainee appears in this mentor’s Referred by list when uploading scans'
          : 'Admin-only · member cannot edit these on profile'}
      </p>
      <div className="admin-create-grid">
        <label className="form-field">
          <span className="form-label">Mentored by{needsMentor ? ' *' : ''}</span>
          <div className="form-select-wrap">
            <select
              className="form-input form-select"
              value={form.mentoredById}
              onChange={(e) => update('mentoredById', e.target.value)}
              required={needsMentor}
            >
              <option value="">{needsMentor ? 'Select mentor' : 'None'}</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.name} · {mentor.role}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">Subscription</span>
          <div className="form-select-wrap">
            <select
              className="form-input form-select"
              value={form.masType}
              onChange={(e) => handleTierChange(e.target.value as AdminMembershipFormState['masType'])}
            >
              {subscriptionTierOptions.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </div>
        </label>
        <BillingSlabField value={form.billing} onChange={(digits) => update('billing', digits)} />
        <label className="form-field">
          <span className="form-label">Date of joining</span>
          <input className="form-input" type="date" value={form.doj} onChange={(e) => update('doj', e.target.value)} />
        </label>
        <label className="form-field">
          <span className="form-label">Expiry date</span>
          <input
            className="form-input"
            type="date"
            value={form.expiryDate}
            onChange={(e) => update('expiryDate', e.target.value)}
          />
        </label>
        {!traineeMode ? (
          <label className="form-field">
            <span className="form-label">Opening balance</span>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              value={form.opBal}
              onChange={(e) => update('opBal', e.target.value)}
              placeholder="0"
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
