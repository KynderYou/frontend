import { subscriptionTierOptions, tierBilling } from '../Admin/adminProfileForm';
import { BillingSlabField } from '../Admin/BillingSlabField';
import type { TraineeFormState } from './traineeForm';

export type TraineeMentorOption = { id: string; name: string };

type TraineeFormFieldsProps = {
  form: TraineeFormState;
  mentors: TraineeMentorOption[];
  onChange: (next: TraineeFormState) => void;
};

export function TraineeFormFields({ form, mentors, onChange }: TraineeFormFieldsProps) {
  const update = <K extends keyof TraineeFormState>(key: K, value: TraineeFormState[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <>
      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Trainee details</h3>
        <p className="admin-form-section-sub">Contact details only · no login or password is created</p>
        <div className="admin-create-grid">
          <label className="form-field">
            <span className="form-label">Full name</span>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Trainee name"
              autoComplete="off"
            />
          </label>
          <label className="form-field">
            <span className="form-label">Phone</span>
            <input
              className="form-input"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="Phone number"
              inputMode="tel"
              autoComplete="off"
            />
          </label>
          <label className="form-field">
            <span className="form-label">Email (optional)</span>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="name@example.com"
              autoComplete="off"
            />
          </label>
        </div>
      </div>

      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Mentorship &amp; billing</h3>
        <p className="admin-form-section-sub">The mentor sees this trainee in Referred by when uploading scans</p>
        <div className="admin-create-grid">
          <label className="form-field">
            <span className="form-label">Mentored by</span>
            <div className="form-select-wrap">
              <select
                className="form-input form-select"
                value={form.mentorId}
                onChange={(e) => update('mentorId', e.target.value)}
              >
                <option value="">Select mentor</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name}
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
                value={form.subscription}
                onChange={(e) => {
                  const tier = e.target.value as TraineeFormState['subscription'];
                  onChange({ ...form, subscription: tier, billing: tierBilling[tier] });
                }}
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
              min={form.doj || undefined}
              onChange={(e) => update('expiryDate', e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Status &amp; notes</h3>
        <p className="admin-form-section-sub">Inactive trainees are hidden from the Referred by list</p>
        <div className="admin-create-grid">
          <label className="form-field">
            <span className="form-label">Status</span>
            <div className="form-select-wrap">
              <select
                className="form-input form-select"
                value={form.status}
                onChange={(e) => update('status', e.target.value as TraineeFormState['status'])}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </label>
          <label className="form-field admin-form-span-2">
            <span className="form-label">Remarks</span>
            <textarea
              className="form-input form-textarea"
              rows={2}
              value={form.remarks}
              onChange={(e) => update('remarks', e.target.value)}
            />
          </label>
        </div>
      </div>
    </>
  );
}
