import { useEffect, useState } from 'react';
import type { CompanyEntryKind } from '../../api/endpoints/ledger';
import { colors, spacing } from '../../styles/theme';

const theme = colors.light;

type AddCompanyEntryModalProps = {
  open: boolean;
  kind: CompanyEntryKind;
  onClose: () => void;
  onSubmit: (title: string, amount: string) => Promise<void>;
  submitting?: boolean;
  error?: string;
};

export function AddCompanyEntryModal({ open, kind, onClose, onSubmit, submitting = false, error = '' }: AddCompanyEntryModalProps) {
  const [title, setTitle] = useState('');
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

  const isReceipt = kind === 'receipt';
  const numeric = Number(amount.replace(/[,₹\s]/g, ''));
  const canSubmit = title.trim().length > 0 && numeric > 0 && !submitting;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-company-entry-title"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="add-company-entry-title" className="modal-title">
              {isReceipt ? 'New receipt' : 'New expense'}
            </h2>
            <p className="modal-subtitle">
              {isReceipt ? 'Credits the shared company ledger.' : 'Debits the shared company ledger.'}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) void onSubmit(title.trim(), amount);
          }}
        >
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            <label className="form-field">
              <span className="form-label">Title</span>
              <input
                className="form-input"
                placeholder={isReceipt ? 'e.g. Franchise fee' : 'e.g. Office rent'}
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </label>
            <label className="form-field">
              <span className="form-label">Amount (₹)</span>
              <input
                className="form-input"
                inputMode="decimal"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
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
            <button type="submit" className="btn-pill-primary" disabled={!canSubmit}>
              {submitting ? 'Saving…' : isReceipt ? 'Add receipt' : 'Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
