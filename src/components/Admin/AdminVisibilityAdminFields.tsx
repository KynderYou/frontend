import type { AdminVisibilityFormState } from './adminProfileForm';
import { brandingOptions } from './adminProfileForm';

type AdminVisibilityAdminFieldsProps = {
  form: AdminVisibilityFormState;
  onChange: (next: AdminVisibilityFormState) => void;
};

export function AdminVisibilityAdminFields({ form, onChange }: AdminVisibilityAdminFieldsProps) {
  const update = <K extends keyof AdminVisibilityFormState>(key: K, value: AdminVisibilityFormState[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="admin-form-section">
      <h3 className="admin-form-section-title">Visibility &amp; admin</h3>
      <p className="admin-form-section-sub">Admin-only · includes certification status</p>
      <div className="admin-create-grid">
        <label className="form-field">
          <span className="form-label">MRP visibility</span>
          <div className="form-select-wrap">
            <select
              className="form-input form-select"
              value={form.mrp}
              onChange={(e) => update('mrp', e.target.value as 'Show' | 'Hide')}
            >
              <option value="Show">Show</option>
              <option value="Hide">Hide</option>
            </select>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">Branding</span>
          <div className="form-select-wrap">
            <select className="form-input form-select" value={form.branding} onChange={(e) => update('branding', e.target.value)}>
              <option value="">None</option>
              {brandingOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label className="form-field">
          <span className="form-label">MIS training</span>
          <input
            className="form-input"
            value={form.misTraining}
            onChange={(e) => update('misTraining', e.target.value)}
            placeholder="Completed / Pending"
          />
        </label>
        <label className="form-field">
          <span className="form-label">Admin by</span>
          <input
            className="form-input"
            value={form.adminBy}
            onChange={(e) => update('adminBy', e.target.value)}
            placeholder="Admin name"
          />
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
        <label className="form-field admin-form-checkbox">
          <input type="checkbox" checked={form.certified} onChange={(e) => update('certified', e.target.checked)} />
          <span className="form-label" style={{ margin: 0 }}>
            Certified
          </span>
        </label>
      </div>
    </div>
  );
}
