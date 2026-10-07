import { useEffect, useState } from 'react';
import type { CabFeedbackStatus, ReportRecord } from './reportTypes';

type CabModalProps = {
  open: boolean;
  record: ReportRecord | null;
  /** Only the scan owner (the mentee) can rate the CAB. */
  isOwner: boolean;
  onClose: () => void;
  onSubmit: (record: ReportRecord, rating: number, comments: string) => Promise<boolean>;
};

const STATUS_COPY: Record<CabFeedbackStatus, { title: string; body: string }> = {
  Pending: {
    title: 'Feedback submitted · awaiting H.O approval',
    body: 'You can still edit your feedback until H.O reviews it.',
  },
  Approved: {
    title: 'Feedback approved',
    body: 'Thank you. H.O approved your feedback for this CAB.',
  },
  Rejected: {
    title: 'Feedback not approved',
    body: 'H.O did not approve this feedback. Update it and submit again.',
  },
};

export function CabModal({ open, record, isOwner, onClose, onSubmit }: CabModalProps) {
  const [rating, setRating] = useState(record?.cabFeedback?.rating ?? 0);
  const [comments, setComments] = useState(record?.cabFeedback?.comments ?? '');
  const [submitting, setSubmitting] = useState(false);

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

  const feedback = record.cabFeedback;
  const editable = isOwner && record.cabEligible && feedback?.status !== 'Approved';
  const status = feedback ? STATUS_COPY[feedback.status] : null;

  const submit = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(record, rating, comments);
    setSubmitting(false);
    if (ok) onClose();
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
        className="modal-panel reports-cab-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cab-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="cab-title" className="modal-title">
              CAB feedback
            </h2>
            <p className="modal-subtitle">
              Scan {record.scanId} · {record.details.name || 'Client'} —{' '}
              {isOwner ? 'rate the counselling audio byte you received.' : "the mentee's rating of the counselling audio byte."}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {status ? (
            <div className={`reports-cab-status is-${feedback!.status.toLowerCase()}`}>
              <p className="reports-cab-empty-title">{status.title}</p>
              <p className="reports-cab-empty-sub">
                Submitted {feedback!.submittedAt}. {isOwner ? status.body : ''}
              </p>
            </div>
          ) : null}

          {!feedback && !isOwner ? (
            <div className="reports-cab-empty">
              <p className="reports-cab-empty-title">No feedback yet</p>
              <p className="reports-cab-empty-sub">The mentee hasn't rated the CAB for this scan.</p>
            </div>
          ) : (
            <div className="reports-cab-form">
              <span className="reports-cab-form-label">Rating</span>
              <div className="reports-cab-stars" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                    className={`reports-cab-star${value <= rating ? ' is-on' : ''}`}
                    disabled={!editable}
                    onClick={() => setRating(value)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <label className="reports-cab-form-label" htmlFor="cab-comments">
                Feedback
              </label>
              <textarea
                id="cab-comments"
                className="reports-cab-comments"
                rows={4}
                maxLength={2000}
                placeholder="Was the audio clear and helpful for your client?"
                value={comments}
                readOnly={!editable}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Close
          </button>
          {editable ? (
            <button type="button" className="btn-pill-primary" disabled={!rating || submitting} onClick={() => void submit()}>
              {submitting ? 'Submitting…' : feedback ? 'Update feedback' : 'Submit feedback'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
