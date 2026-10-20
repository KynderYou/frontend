import { useEffect, useState } from 'react';
import type { ReviewApi, ReviewRewardAmount } from '../../api/types';

const REWARD_OPTIONS: { amount: ReviewRewardAmount; label: string; hint: string }[] = [
  { amount: 50, label: 'Good', hint: 'Short, genuine feedback' },
  { amount: 100, label: 'Great', hint: 'Detailed, specific feedback' },
  { amount: 150, label: 'Outstanding', hint: 'Rich detail, photos or a strong story' },
];

type ReviewRewardModalProps = {
  review: ReviewApi | null;
  busy: boolean;
  onClose: () => void;
  onSave: (review: ReviewApi, amount: ReviewRewardAmount | null) => void;
};

export function ReviewRewardModal({ review, busy, onClose, onSave }: ReviewRewardModalProps) {
  const current = (review?.reward_amount ?? null) as ReviewRewardAmount | null;
  const [selected, setSelected] = useState<ReviewRewardAmount | null>(current);

  useEffect(() => {
    if (!review) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [review, onClose, busy]);

  if (!review) return null;

  const who = review.posted_by_name;
  const what = review.client_name ? `${review.kind_label} · ${review.client_name}` : review.kind_label;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="modal-panel confirm-modal review-reward-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-reward-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="review-reward-title" className="modal-title">
              Reward {who}
            </h2>
            <p className="modal-subtitle">{what}</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="review-reward-options" role="radiogroup" aria-label="Reward amount">
            {REWARD_OPTIONS.map((option) => (
              <button
                key={option.amount}
                type="button"
                role="radio"
                aria-checked={selected === option.amount}
                className={`review-reward-option${selected === option.amount ? ' is-active' : ''}`}
                disabled={busy}
                onClick={() => setSelected(option.amount)}
              >
                <strong>₹{option.amount}</strong>
                <span>{option.label}</span>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
          <p className="review-reward-note">
            Recorded for the annual payout only. Nothing is credited to the ledger now.
          </p>
        </div>

        <div className="modal-footer">
          {current ? (
            <button
              type="button"
              className="btn-pill-secondary review-reward-remove"
              disabled={busy}
              onClick={() => onSave(review, null)}
            >
              Remove reward
            </button>
          ) : null}
          <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-pill-primary review-reward-save"
            disabled={busy || selected === null || selected === current}
            onClick={() => selected && onSave(review, selected)}
          >
            {busy ? 'Saving…' : selected ? `Reward ₹${selected}` : 'Choose an amount'}
          </button>
        </div>
      </div>
    </div>
  );
}
