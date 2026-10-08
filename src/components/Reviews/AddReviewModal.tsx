import { useEffect, useState } from 'react';
import type { NewReview } from '../../api/endpoints/reviews';
import type { ReviewKind } from '../../api/types';
import { colors, spacing } from '../../styles/theme';
import { REVIEW_KIND_OPTIONS } from './reviewKinds';

const theme = colors.light;

type AddReviewModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (review: NewReview) => Promise<void>;
  submitting?: boolean;
  error?: string;
};

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const AUDIO_ACCEPT = '.mp3,audio/mpeg';

function isWebLink(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function AddReviewModal({ open, onClose, onSubmit, submitting = false, error = '' }: AddReviewModalProps) {
  const [kind, setKind] = useState<ReviewKind>('google');
  const [platform, setPlatform] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [clientName, setClientName] = useState('');
  const [caption, setCaption] = useState('');

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

  const isAudio = kind === 'audio';
  const linkInvalid = !isAudio && link.trim().length > 0 && !isWebLink(link);
  const hasProof = isAudio ? Boolean(file) : Boolean(file) || (link.trim().length > 0 && !linkInvalid);
  const canSubmit = hasProof && !linkInvalid && (kind !== 'other' || platform.trim().length > 0) && !submitting;

  const chooseKind = (next: ReviewKind) => {
    if (next === kind) return;
    setKind(next);
    setFile(null);
    if (next === 'audio') setLink('');
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-review-title"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="add-review-title" className="modal-title">
              Add a review
            </h2>
            <p className="modal-subtitle">Share a client review with the network. Your name is shown with it.</p>
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
            if (!canSubmit) return;
            void onSubmit({
              kind,
              platform: kind === 'other' ? platform.trim() : '',
              link: isAudio ? '' : link.trim(),
              clientName: clientName.trim(),
              caption: caption.trim(),
              file,
            });
          }}
        >
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            <div className="form-field">
              <span className="form-label">Review type</span>
              <div className="review-kind-picker" role="radiogroup" aria-label="Review type">
                {REVIEW_KIND_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={kind === option.id}
                    className={`review-kind-option tone-${option.tone}${kind === option.id ? ' is-active' : ''}`}
                    onClick={() => chooseKind(option.id)}
                  >
                    <span className="review-kind-icon">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {kind === 'other' ? (
              <label className="form-field">
                <span className="form-label">Platform</span>
                <input
                  className="form-input"
                  placeholder="e.g. Facebook, YouTube, LinkedIn"
                  maxLength={40}
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                />
              </label>
            ) : null}

            {isAudio ? (
              <label className="form-field">
                <span className="form-label">MP3 audio</span>
                <input
                  className="form-input review-file-input"
                  type="file"
                  accept={AUDIO_ACCEPT}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <span className="review-field-hint">MP3 only · up to 25 MB</span>
              </label>
            ) : (
              <>
                <label className="form-field">
                  <span className="form-label">Review link</span>
                  <input
                    className="form-input"
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    aria-invalid={linkInvalid}
                  />
                  {linkInvalid ? (
                    <span className="review-field-hint" style={{ color: theme.error }}>
                      Paste the full link, starting with https://
                    </span>
                  ) : null}
                </label>
                <label className="form-field">
                  <span className="form-label">or upload a picture</span>
                  <input
                    className="form-input review-file-input"
                    type="file"
                    accept={IMAGE_ACCEPT}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <span className="review-field-hint">Screenshot of the review · JPEG, PNG or WebP · up to 10 MB</span>
                </label>
              </>
            )}

            <label className="form-field">
              <span className="form-label">Client name (optional)</span>
              <input
                className="form-input"
                maxLength={120}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Notes (optional)</span>
              <textarea
                className="form-input review-notes"
                maxLength={500}
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
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
              {submitting ? 'Posting…' : 'Post review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
