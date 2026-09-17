import { useEffect } from 'react';
import { CabPlayButton } from './CabPlayButton';
import type { ReportRecord } from './reportTypes';

type CabModalProps = {
  open: boolean;
  record: ReportRecord | null;
  onClose: () => void;
  onRequest: (record: ReportRecord) => void;
};

export function CabModal({ open, record, onClose, onRequest }: CabModalProps) {
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

  if (!open || !record) return null;

  const hasAudios = record.cabAudios.length > 0;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel reports-cab-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cab-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="cab-title" className="modal-title">
              Counselling Audio Bytes
            </h2>
            <p className="modal-subtitle">
              Scan {record.scanId} · {record.details.name || 'Client'} — guided audio explanations for this report.
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {hasAudios ? (
            <ul className="reports-cab-list">
              {record.cabAudios.map((audio, index) => (
                <li key={audio.id} className="reports-cab-item">
                  <span className="reports-cab-item-body">
                    <span className="reports-cab-item-title">
                      {index + 1}. {audio.title}
                    </span>
                    <span className="reports-cab-item-meta">{audio.counsellor}</span>
                  </span>
                  <CabPlayButton url={audio.url} title={audio.title} durationSec={audio.durationSec} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="reports-cab-empty">
              <p className="reports-cab-empty-title">
                {record.cabRequestedAt ? 'CAB requested' : 'No audio bytes yet'}
              </p>
              <p className="reports-cab-empty-sub">
                {record.cabRequestedAt
                  ? `Requested on ${record.cabRequestedAt}. The counselling team will attach audio bytes shortly.`
                  : 'Request counselling audio bytes for this report and the counselling team will record them for your client.'}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Close
          </button>
          {!hasAudios && !record.cabRequestedAt && (
            <button
              type="button"
              className="btn-pill-primary"
              onClick={() => onRequest(record)}
            >
              Request CAB
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
