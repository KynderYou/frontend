import { useEffect, useState } from 'react';
import { colors } from '../../styles/theme';
import type { ScanDetails } from './scanTypes';
import { REPORT_PACKAGES } from '../Reports/reportPackages';

const theme = colors.light;

type EditScanModalProps = {
  open: boolean;
  scanId: string;
  initial: ScanDetails;
  /** Mentor trainee directory names for Referred by */
  traineeNames?: string[];
  onClose: () => void;
  onSave: (details: ScanDetails) => void;
};

export const CLIENT_TYPE_INDIVIDUAL = 'Individual';
export const CLIENT_TYPE_FAMILY = 'Family (phone required)';

const clientTypeOptions = [CLIENT_TYPE_INDIVIDUAL, CLIENT_TYPE_FAMILY] as const;
const BASE_REFERRED_BY = ['SELF', 'MLA', 'HO', 'Referral'] as const;
const genderOptions = ['Male', 'Female', 'Other'] as const;

function normalizeClientType(value: string): string {
  const raw = value.trim();
  if (!raw) return CLIENT_TYPE_INDIVIDUAL;
  const lower = raw.toLowerCase();
  if (lower === 'individual' || lower === 'personal' || lower === 'private') {
    return CLIENT_TYPE_INDIVIDUAL;
  }
  if (
    lower.startsWith('family') ||
    lower === 'institution' ||
    lower === 'bulk' ||
    lower === 'business' ||
    lower === 'corporate' ||
    lower === 'company'
  ) {
    return CLIENT_TYPE_FAMILY;
  }
  if (clientTypeOptions.includes(raw as (typeof clientTypeOptions)[number])) return raw;
  return CLIENT_TYPE_INDIVIDUAL;
}

function phoneRequiredFor(clientType: string): boolean {
  return normalizeClientType(clientType) === CLIENT_TYPE_FAMILY;
}

export function EditScanModal({ open, scanId, initial, traineeNames = [], onClose, onSave }: EditScanModalProps) {
  const [form, setForm] = useState<ScanDetails>(() => ({
    ...initial,
    clientType: normalizeClientType(initial.clientType),
  }));

  const referredByOptions = [
    ...BASE_REFERRED_BY,
    ...traineeNames.filter((name) => name && !(BASE_REFERRED_BY as readonly string[]).includes(name)),
  ];
  if (form.referredBy && !referredByOptions.includes(form.referredBy)) {
    referredByOptions.push(form.referredBy);
  }

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
    if (open) {
      setForm({
        ...initial,
        clientType: normalizeClientType(initial.clientType),
      });
    }
  }, [open, initial]);

  if (!open) return null;

  const update = (key: keyof ScanDetails) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setForm((f) => {
      if (key === 'clientType') {
        const nextType = normalizeClientType(value);
        return {
          ...f,
          clientType: nextType,
          phone: nextType === CLIENT_TYPE_INDIVIDUAL ? '' : f.phone,
        };
      }
      return { ...f, [key]: value };
    });
  };

  const needsPhone = phoneRequiredFor(form.clientType);
  const canSave =
    form.name.trim().length > 0 &&
    form.age.trim().length > 0 &&
    form.gender.trim().length > 0 &&
    form.mrp.trim().length > 0 &&
    (!needsPhone || form.phone.trim().length > 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const clientType = normalizeClientType(form.clientType);
    onSave({
      clientType,
      referredBy: form.referredBy,
      name: form.name.trim(),
      age: form.age.trim(),
      phone: clientType === CLIENT_TYPE_INDIVIDUAL ? '' : form.phone.trim(),
      gender: form.gender,
      mrp: form.mrp,
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
        aria-labelledby="edit-scan-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="edit-scan-title" className="modal-title">
              Edit scan details
            </h2>
            <p className="modal-subtitle">
              Save keeps details on your side. Use Export in the table row to send to Head Office.
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <label className="form-field">
                <span className="form-label">Scan Id</span>
                <input className="form-input" type="text" value={scanId} readOnly disabled />
              </label>

              <label className="form-field">
                <span className="form-label">Referred By</span>
                <div className="form-select-wrap">
                  <select className="form-input form-select" value={form.referredBy} onChange={update('referredBy')}>
                    {referredByOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <svg className="form-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </label>

              <label className="form-field">
                <span className="form-label">Name</span>
                <input className="form-input" type="text" value={form.name} onChange={update('name')} />
              </label>

              <label className="form-field">
                <span className="form-label">Client Type</span>
                <div className="form-select-wrap">
                  <select className="form-input form-select" value={form.clientType} onChange={update('clientType')}>
                    {clientTypeOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <svg className="form-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </label>

              <label className="form-field">
                <span className="form-label">Age</span>
                <input className="form-input" type="number" min={1} max={120} value={form.age} onChange={update('age')} />
              </label>

              {needsPhone ? (
                <label className="form-field">
                  <span className="form-label">Phno</span>
                  <input className="form-input" type="tel" value={form.phone} onChange={update('phone')} required />
                </label>
              ) : null}

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
                  <svg className="form-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </label>

              <label className="form-field">
                <span className="form-label">Report package</span>
                <div className="form-select-wrap">
                  <select className="form-input form-select" value={form.mrp} onChange={update('mrp')}>
                    <option value="" disabled>
                      Choose package
                    </option>
                    {REPORT_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.mrp}>
                        {pkg.id} · {pkg.mrp} · {pkg.pages} pages
                      </option>
                    ))}
                  </select>
                  <svg className="form-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-pill-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-pill-primary"
              disabled={!canSave}
              style={{
                opacity: canSave ? 1 : 0.5,
                cursor: canSave ? 'pointer' : 'not-allowed',
                color: theme['text-inverse'],
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
