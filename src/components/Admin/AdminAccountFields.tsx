import type { AdminAccountFormState } from './adminProfileForm';
import { roleOptions } from './adminProfileForm';

type AdminAccountFieldsProps = {
  form: AdminAccountFormState;
  onChange: (next: AdminAccountFormState) => void;
};

export function AdminAccountFields({ form, onChange }: AdminAccountFieldsProps) {
  const update = <K extends keyof AdminAccountFormState>(key: K, value: AdminAccountFormState[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="admin-form-section">
      <h3 className="admin-form-section-title">Account</h3>
      <p className="admin-form-section-sub">Login credentials and role</p>
      <div className="admin-create-grid">
        <label className="form-field">
          <span className="form-label">Full name</span>
          <input
            className="form-input"
            type="text"
            placeholder="Member name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="form-field">
          <span className="form-label">Email</span>
          <input
            className="form-input"
            type="email"
            placeholder="name@midna.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="form-field">
          <span className="form-label">Phone</span>
          <input
            className="form-input"
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            autoComplete="tel"
          />
        </label>
        <label className="form-field">
          <span className="form-label">Password</span>
          <input
            className="form-input"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="form-field">
          <span className="form-label">Role</span>
          <div className="form-select-wrap">
            <select
              className="form-input form-select"
              value={form.role}
              onChange={(e) => update('role', e.target.value as AdminAccountFormState['role'])}
            >
              <option value="" disabled>
                Select role
              </option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>
    </div>
  );
}
