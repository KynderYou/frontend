import { useEffect, useState } from 'react';
import { colors, spacing } from '../../styles/theme';

const theme = colors.light;

const QUICK_AMOUNTS = [
  { value: '100000', label: '₹1,00,000' },
  { value: '500000', label: '₹5,00,000' },
  { value: '1000000', label: '₹10,00,000' },
] as const;

type AddFundsModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: string) => Promise<void>;
  submitting?: boolean;
  error?: string;
};

export function AddFundsModal({ open, onClose, onSubmit, submitting = false, error = '' }: AddFundsModalProps) {
  const [amount, setAmount] = useState('');

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

  if (!open) return null;

  const numeric = Number(amount.replace(/[,₹\s]/g, ''));
  const canSubmit = numeric > 0 && !submitting;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-funds-title"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="add-funds-title" className="modal-title">
              Add funds
            </h2>
            <p className="modal-subtitle">Credit the shared company ledger used to pay mentors for approved CAB feedback.</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
          <label className="form-field">
            <span className="form-label">Amount (₹)</span>
            <input
              className="form-input"
              inputMode="decimal"
              placeholder="e.g. 250000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_AMOUNTS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={amount === option.value ? 'btn-pill-primary' : 'btn-pill-secondary'}
                aria-pressed={amount === option.value}
                onClick={() => setAmount(option.value)}
              >
                {option.label}
              </button>
            ))}
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
          <button type="button" className="btn-pill-primary" disabled={!canSubmit} onClick={() => void onSubmit(amount)}>
            {submitting ? 'Adding…' : 'Add funds'}
          </button>
        </div>
      </div>
    </div>
  );
}
