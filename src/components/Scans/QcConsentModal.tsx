import { useEffect, useState } from 'react';
import { isConsentImage } from './scanImages';
import type { ScanRecord } from './scanTypes';

type QcConsentModalProps = {
  record: ScanRecord | null;
  onClose: () => void;
  onConfirm: (record: ScanRecord) => Promise<void>;
};

/** Mark QC gate: the uploader reviews the scan's consent form and agrees before QC is recorded. */
export function QcConsentModal({ record, onClose, onConfirm }: QcConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!record) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [record, onClose, submitting]);

  if (!record) return null;

  const consentImage = (record.images ?? []).find(isConsentImage) ?? null;
  const clientName = record.details.name || 'this client';

  const confirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(record);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="modal-panel qc-consent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qc-consent-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="qc-consent-title" className="modal-title">
              Check consent form
            </h2>
            <p className="modal-subtitle">
              {record.scanId} · {clientName} — review the signed consent form before marking QC checked.
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose} disabled={submitting}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="qc-consent-frame">
            {consentImage ? (
              <a href={consentImage.url} target="_blank" rel="noopener noreferrer" title="Open full size">
                <img src={consentImage.url} alt={`Consent form for ${clientName}`} />
              </a>
            ) : (
              <p className="qc-consent-missing">No consent form image found in this scan package.</p>
            )}
          </div>

          <label className="qc-consent-agree">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={submitting} />
            <span>
              I have checked the consent form — it is signed by {clientName === 'this client' ? 'the client / parent' : `${clientName} / parent`},
              legible and belongs to this scan.
            </span>
          </label>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn-pill-primary" onClick={() => void confirm()} disabled={!agreed || submitting}>
            {submitting ? 'Marking…' : 'Agree & mark QC checked'}
          </button>
        </div>
      </div>
    </div>
  );
}
