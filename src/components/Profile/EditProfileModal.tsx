import { useEffect, useRef, useState } from 'react';
import { updateMyProfile, uploadCertification } from '../../api';
import type { MemberProfile } from '../../api';
import { colors, radius, shadow, spacing } from '../../styles/theme';

const theme = colors.light;

type EditProfileModalProps = {
  open: boolean;
  profile: MemberProfile;
  onClose: () => void;
  onSaved: (profile: MemberProfile) => void;
};

type FormState = {
  name: string;
  mobileAccounts: string;
  mobileCounselling: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  uid: string;
  mailId: string;
  nurturingServices: string;
};

const stateOptions = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Delhi',
];

type FieldKey = keyof Omit<FormState, 'nurturingServices'>;

const textFields: { key: FieldKey; label: string; type?: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'mobileAccounts', label: 'Mobile (for accounts)', type: 'tel' },
  { key: 'mobileCounselling', label: 'Mobile (for counselling)', type: 'tel' },
  { key: 'city', label: 'City' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'address', label: 'Address' },
  { key: 'uid', label: 'UID' },
  { key: 'mailId', label: 'Mail ID', type: 'email' },
];

function profileToForm(profile: MemberProfile): FormState {
  return {
    name: profile.name,
    mobileAccounts: profile.mobile_1,
    mobileCounselling: profile.mobile_2,
    city: profile.city,
    state: profile.state,
    pincode: profile.pincode,
    address: profile.address,
    uid: profile.uid,
    mailId: profile.mail_id,
    nurturingServices: profile.services,
  };
}

export function EditProfileModal({ open, profile, onClose, onSaved }: EditProfileModalProps) {
  const [form, setForm] = useState<FormState>(() => profileToForm(profile));
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [certName, setCertName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const certInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(profileToForm(profile));
      setError('');
    }
  }, [open, profile]);

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
    if (open) return;
    setCertPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCertName(null);
    setCertFile(null);
  }, [open]);

  if (!open) return null;

  const update = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertFile(file);
    setCertPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setCertName(file.name);
    e.target.value = '';
  };

  const clearCert = () => {
    setCertFile(null);
    setCertPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCertName(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await updateMyProfile({
        name: form.name,
        mail_id: form.mailId,
        mobile_1: form.mobileAccounts,
        mobile_2: form.mobileCounselling,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        address: form.address,
        uid: form.uid,
        services: form.nurturingServices,
      });
      if (certFile) {
        await uploadCertification(certFile);
      }
      onSaved(updated);
      onClose();
    } catch {
      setError('Unable to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Edit your profile">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit your profile</h2>
            <p className="modal-subtitle">Update your contact details and add certifications.</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error ? (
              <p role="alert" style={{ color: theme.error, fontSize: 13, marginBottom: spacing[3] }}>
                {error}
              </p>
            ) : null}
            <div className="form-grid">
              {textFields.map((field) => (
                <label key={field.key} className="form-field">
                  <span className="form-label">{field.label}</span>
                  <input
                    type={field.type ?? 'text'}
                    className="form-input"
                    value={form[field.key]}
                    onChange={update(field.key)}
                  />
                </label>
              ))}

              <label className="form-field">
                <span className="form-label">State</span>
                <div className="form-select-wrap">
                  <select className="form-input form-select" value={form.state} onChange={update('state')}>
                    {stateOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
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

            <label className="form-field" style={{ marginTop: 18 }}>
              <span className="form-label">My nurturing services</span>
              <textarea
                className="form-input form-textarea"
                rows={3}
                value={form.nurturingServices}
                onChange={update('nurturingServices')}
              />
            </label>

            <div className="form-field" style={{ marginTop: 18 }}>
              <span className="form-label">Certification</span>
              <input
                ref={certInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={handleCertChange}
                style={{ display: 'none' }}
              />

              {certPreview ? (
                <div
                  style={{
                    borderRadius: radius.lg,
                    overflow: 'hidden',
                    background: theme['bg-muted'],
                    boxShadow: shadow.float,
                  }}
                >
                  <img
                    src={certPreview}
                    alt="Certification preview"
                    style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '12px 14px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: theme['text-secondary'],
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {certName}
                    </span>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn-pill-secondary"
                        style={{ height: 32, fontSize: 12, padding: '0 12px' }}
                        onClick={() => certInputRef.current?.click()}
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        className="btn-pill-secondary"
                        style={{ height: 32, fontSize: 12, padding: '0 12px', color: theme.error }}
                        onClick={clearCert}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-pill-secondary"
                  onClick={() => certInputRef.current?.click()}
                  style={{ alignSelf: 'flex-start', height: 40 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4" />
                    <path d="m6 10 6-6 6 6" />
                    <path d="M4 20h16" />
                  </svg>
                  Add certification
                </button>
              )}
              <span style={{ fontSize: 12, color: theme['text-muted'], marginTop: spacing[1] }}>
                PNG, JPG, WebP, or PDF
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-pill-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
