import { useEffect, useMemo } from 'react';
import { buildFingerViewIndex, findFingerViewImage } from './scanImages';
import type { ScanImage } from './scanTypes';

const HANDS = [
  { label: 'Left Hand', fingers: ['L1', 'L2', 'L3', 'L4', 'L5'] },
  { label: 'Right Hand', fingers: ['R1', 'R2', 'R3', 'R4', 'R5'] },
] as const;

type FingerprintSheetModalProps = {
  open: boolean;
  scanId: string;
  name: string;
  images: ScanImage[];
  loading?: boolean;
  onClose: () => void;
};

/** All ten centre-view prints on one sheet, grouped by hand. */
export function FingerprintSheetModal({ open, scanId, name, images, loading, onClose }: FingerprintSheetModalProps) {
  const index = useMemo(() => buildFingerViewIndex(images), [images]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel fingerprint-sheet-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fingerprint-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="fingerprint-sheet-title" className="modal-title">
              Scan images
            </h2>
            <p className="modal-subtitle">
              Scan ID: {scanId} · Name: {name}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body fingerprint-sheet-body">
          {HANDS.map((hand) => (
            <section key={hand.label} className="fingerprint-sheet-hand">
              <h3 className="fingerprint-sheet-hand-title">{hand.label}</h3>
              <div className="fingerprint-sheet-row">
                {hand.fingers.map((finger) => {
                  const image = loading ? undefined : findFingerViewImage(images, finger, 'C', index);
                  return (
                    <figure key={finger} className="fingerprint-sheet-cell">
                      {image ? (
                        <img src={image.url} alt={`${finger} fingerprint`} loading="lazy" />
                      ) : (
                        <span className={`fingerprint-sheet-empty${loading ? ' is-loading' : ''}`}>
                          {loading ? '' : 'No image'}
                        </span>
                      )}
                      <figcaption>{finger}</figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
