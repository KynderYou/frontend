import { useEffect, useRef, useState } from 'react';
import { colors, radius, shadow, spacing } from '../../styles/theme';

const theme = colors.light;

const TOPUP_AMOUNTS = [
  { value: '5000', label: '₹5,000' },
  { value: '10000', label: '₹10,000' },
] as const;

type TopUpModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (amount: string, proof: File) => Promise<void>;
  submitting?: boolean;
  error?: string;
};

export function TopUpModal({ open, onClose, onSubmit, submitting = false, error = '' }: TopUpModalProps) {
  const [amount, setAmount] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setAmount('');
    setProofPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setProofName(null);
    setProofFile(null);
  }, [open]);

  if (!open) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(URL.createObjectURL(file));
    setProofName(file.name);
    setProofFile(file);
    e.target.value = '';
  };

  const clearProof = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(null);
    setProofName(null);
    setProofFile(null);
  };

  const canSubmit = Boolean(amount) && Boolean(proofFile) && !submitting;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topup-title"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="topup-title" className="modal-title">
              Top up
            </h2>
            <p className="modal-subtitle">Choose ₹5,000 or ₹10,000 and upload a payment proof photo.</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
          <fieldset className="form-field" style={{ border: 'none', margin: 0, padding: 0 }}>
            <legend className="form-label">Top-up amount</legend>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {TOPUP_AMOUNTS.map((option) => {
                const active = amount === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={active ? 'btn-pill-primary' : 'btn-pill-secondary'}
                    aria-pressed={active}
                    onClick={() => setAmount(option.value)}
                    style={{ flex: 1 }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="form-field">
            <span className="form-label">Proof of payment</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

            {proofPreview ? (
              <div
                style={{
                  borderRadius: radius.lg,
                  overflow: 'hidden',
                  background: theme['bg-muted'],
                  boxShadow: shadow.float,
                }}
              >
                <img
                  src={proofPreview}
                  alt="Payment proof preview"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px' }}>
                  <span style={{ fontSize: 12, color: theme['text-secondary'], overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {proofName}
                  </span>
                  <button type="button" className="btn-pill-secondary" onClick={clearProof}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn-pill-secondary"
                onClick={() => fileRef.current?.click()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Upload proof photo
              </button>
            )}
          </div>

          {error ? (
            <p role="alert" style={{ margin: 0, color: theme.error, fontSize: 13 }}>
              {error}
            </p>
          ) : null}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-pill-primary"
            disabled={!canSubmit}
            onClick={() => {
              if (!proofFile || !amount || !onSubmit) return;
              void onSubmit(amount, proofFile);
            }}
          >
            {submitting ? 'Submitting…' : 'Submit top-up'}
          </button>
        </div>
      </div>
    </div>
  );
}
