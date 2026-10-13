import { useEffect, useState } from 'react';
import { colors } from '../../styles/theme';
import type { ScanDetails } from './scanTypes';
import { ScanDetailsFields } from './ScanDetailsFields';
import { brandingRequiresPhone, normalizeClientType, phoneRequiredFor, scanDetailsComplete } from './scanDetails';
import { useCurrentMember } from '../Auth/MemberContext';

const theme = colors.light;

type EditScanModalProps = {
  open: boolean;
  scanId: string;
  initial: ScanDetails;
  /** Mentor trainee directory names for Referred by */
  traineeNames?: string[];
  onClose: () => void;
  onSave: (details: ScanDetails) => void;
  hideReferredBy?: boolean;
};

export function EditScanModal({
  open,
  scanId,
  initial,
  traineeNames = [],
  onClose,
  onSave,
  hideReferredBy = false,
}: EditScanModalProps) {
  const memberRequiresPhone = brandingRequiresPhone(useCurrentMember()?.branding);
  const [form, setForm] = useState<ScanDetails>(() => ({
    ...initial,
    clientType: normalizeClientType(initial.clientType),
  }));

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

  const canSave = scanDetailsComplete(form, memberRequiresPhone);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const clientType = normalizeClientType(form.clientType);
    onSave({
      clientType,
      referredBy: form.referredBy,
      name: form.name.trim(),
      age: form.age.trim(),
      phone: phoneRequiredFor(clientType, memberRequiresPhone) ? form.phone.trim() : '',
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
            <ScanDetailsFields
              scanId={scanId}
              value={form}
              onChange={setForm}
              traineeNames={traineeNames}
              memberRequiresPhone={memberRequiresPhone}
              hideReferredBy={hideReferredBy}
            />
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
