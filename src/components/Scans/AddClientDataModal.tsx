import { useEffect, useState } from 'react';
import { genderOptions } from './scanDetails';

export type ClientData = {
  name: string;
  age: string;
  phone: string;
  gender: string;
};

type AddClientDataModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClientData) => void;
};

const emptyForm: ClientData = {
  name: '',
  age: '',
  phone: '',
  gender: '',
};


export function AddClientDataModal({ open, onClose, onSubmit }: AddClientDataModalProps) {
  const [form, setForm] = useState<ClientData>(emptyForm);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setForm(emptyForm);
  }, [open]);

  if (!open) return null;

  const update = (key: keyof ClientData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const canSubmit =
    form.name.trim().length > 0 &&
    form.age.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.gender.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: form.name.trim(),
      age: form.age.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
    });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-client-title"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="add-client-title" className="modal-title">
              Add Client
            </h2>
            <p className="modal-subtitle">Enter client details for MLA scan processing.</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label className="form-field">
              <span className="form-label">Name</span>
              <input
                className="form-input"
                type="text"
                placeholder="Client full name"
                value={form.name}
                onChange={update('name')}
                autoFocus
              />
            </label>

            <label className="form-field">
              <span className="form-label">Age</span>
              <input
                className="form-input"
                type="number"
                min={1}
                max={120}
                placeholder="e.g. 12"
                value={form.age}
                onChange={update('age')}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Phno</span>
              <input
                className="form-input"
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={update('phone')}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Gender</span>
              <div className="form-select-wrap">
                <select className="form-input form-select" value={form.gender} onChange={update('gender')}>
                  <option value="" disabled>
                    Select gender
                  </option>
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <svg
                  className="form-select-chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-pill-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-pill-primary"
              disabled={!canSubmit}
              style={{
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
