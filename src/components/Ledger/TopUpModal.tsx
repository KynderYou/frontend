import { useEffect, useRef, useState } from 'react';
import { colors, radius, shadow, spacing } from '../../styles/theme';

const theme = colors.light;

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

  const canSubmit = amount.trim().length > 0 && Boolean(proofFile) && !submitting;

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
            <p className="modal-subtitle">Enter the amount sent and upload a payment proof photo.</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
          <label className="form-field">
            <span className="form-label">Amount sent</span>
            <input
              className="form-input"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

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
                    {proofName}
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button type="button" className="btn-pill-secondary" style={{ height: 32, fontSize: 12, padding: '0 12px' }} onClick={() => fileRef.current?.click()}>
                      Replace
                    </button>
                    <button type="button" className="btn-pill-secondary" style={{ height: 32, fontSize: 12, padding: '0 12px', color: theme.error }} onClick={clearProof}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: radius.lg,
                  padding: spacing[6],
                  background: theme['bg-muted'],
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: theme['bg-surface'],
                    color: theme.primary,
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: shadow.float,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: theme['text-primary'] }}>Upload proof picture</span>
                <span style={{ fontSize: 12, color: theme['text-muted'], textAlign: 'center' }}>
                  Photo of the transfer / UPI / bank receipt
                </span>
              </button>
            )}
          </div>
        </div>

        {error ? (
          <p role="alert" style={{ margin: `0 ${spacing[5]}`, color: theme.error, fontSize: 13 }}>
            {error}
          </p>
        ) : null}

        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-pill-primary"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit || !proofFile || !onSubmit) return;
              void onSubmit(amount, proofFile);
            }}
            style={{ opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            {submitting ? 'Submitting…' : 'Submit top up'}
          </button>
        </div>
      </div>
    </div>
  );
}
