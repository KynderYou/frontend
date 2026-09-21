import { useEffect, useMemo, useState } from 'react';
import { buildFingerViewIndex, findFingerViewImage, type FingerViewTab } from './scanImages';
import type { ScanImage, ScanRecord } from './scanTypes';

const LEFT_FINGERS = ['L1', 'L2', 'L3', 'L4', 'L5'] as const;
const RIGHT_FINGERS = ['R1', 'R2', 'R3', 'R4', 'R5'] as const;
const VIEW_TABS = ['L', 'C', 'R'] as const satisfies readonly FingerViewTab[];
const VIEW_LABELS: Record<FingerViewTab, string> = {
  L: 'Left side',
  C: 'Centre',
  R: 'Right side',
};

type ScanImagesModalProps = {
  open: boolean;
  record: ScanRecord | null;
  onClose: () => void;
};

function isConsentImage(image: ScanImage): boolean {
  const base = image.name.replace(/\.[^.]+$/i, '').toLowerCase();
  return base === 'photo' || base.startsWith('consent') || /consent/i.test(image.label);
}

function PlaceholderFingerprint({ slot }: { slot: number }) {
  const ridges = 7 + (slot % 4);
  return (
    <svg className="process-scan-fingerprint-svg" viewBox="0 0 80 80" aria-hidden="true">
      <ellipse cx="40" cy="42" rx="26" ry="30" fill="none" stroke="#2d3436" strokeWidth="1.2" opacity="0.85" />
      {Array.from({ length: ridges }, (_, i) => {
        const ry = 8 + i * 3.2;
        const opacity = 0.35 + (i % 3) * 0.15;
        return (
          <ellipse
            key={i}
            cx="40"
            cy={40 + i * 0.6}
            rx={22 - i * 2.2}
            ry={ry}
            fill="none"
            stroke="#495057"
            strokeWidth={1 + (i % 2) * 0.3}
            opacity={opacity}
            transform={`rotate(${-8 + slot * 3 + i * 2} 40 40)`}
          />
        );
      })}
    </svg>
  );
}

function ViewPanel({
  finger,
  view,
  images,
  imageIndex,
}: {
  finger: string;
  view: FingerViewTab;
  images: ScanImage[];
  imageIndex: Map<string, ScanImage>;
}) {
  const image = findFingerViewImage(images, finger, view, imageIndex);
  const slot = Number.parseInt(finger.slice(1), 10) || 1;

  return (
    <div className="process-scan-panel scan-images-panel">
      <div className="process-scan-image-frame">
        {image ? (
          <img src={image.url} alt={`${finger} ${VIEW_LABELS[view]}`} className="process-scan-fingerprint-img" />
        ) : (
          <PlaceholderFingerprint slot={slot} />
        )}
        <div className="process-scan-panel-overlay process-scan-panel-overlay-top">
          <span className="process-scan-finger-badge">{finger}</span>
          <span className="process-scan-view-tab is-active scan-images-view-badge" aria-hidden="true">
            {view}
          </span>
        </div>
      </div>
      <p className="scan-images-panel-caption">{VIEW_LABELS[view]}</p>
    </div>
  );
}

/** View-only fingerprint browser — same layout language as Process Scan (3 big L/C/R views). */
export function ScanImagesModal({ open, record, onClose }: ScanImagesModalProps) {
  const [finger, setFinger] = useState('L1');
  const [showConsent, setShowConsent] = useState(false);

  const images = record?.images ?? [];
  const imageIndex = useMemo(() => buildFingerViewIndex(images), [images]);
  const consentImages = useMemo(() => images.filter(isConsentImage), [images]);
  const consentImage = consentImages[0] ?? null;

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
    if (!open) return;
    setFinger('L1');
    setShowConsent(false);
  }, [open, record?.id]);

  if (!open || !record) return null;

  const clientLabel = record.details.name || 'Unnamed scan';
  const totalImages = images.length;
  const slot = Number.parseInt(finger.slice(1), 10) || 1;

  return (
    <div
      className="modal-overlay process-scan-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel process-scan-modal scan-images-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-images-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header process-scan-header">
          <div>
            <h2 id="scan-images-title" className="modal-title">
              Scan images
            </h2>
            <p className="modal-subtitle">
              {record.scanId} · {clientLabel}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body process-scan-body scan-images-view-body">
          {showConsent ? (
            <div className="process-scan-panel scan-images-consent-panel">
              <div className="process-scan-image-frame">
                {consentImage ? (
                  <img
                    src={consentImage.url}
                    alt="Consent form"
                    className="process-scan-fingerprint-img"
                  />
                ) : (
                  <PlaceholderFingerprint slot={1} />
                )}
                <div className="process-scan-panel-overlay process-scan-panel-overlay-top">
                  <span className="process-scan-finger-badge">Consent form</span>
                </div>
              </div>
            </div>
          ) : (
            VIEW_TABS.map((view) => (
              <ViewPanel
                key={view}
                finger={finger}
                view={view}
                images={images}
                imageIndex={imageIndex}
              />
            ))
          )}
        </div>

        <div className="process-scan-controls scan-images-view-controls">
          <div className="scan-images-toolbar" role="toolbar" aria-label="Select finger">
            <div className="scan-images-seg" aria-label="Left hand">
              {LEFT_FINGERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`scan-images-chip scan-images-chip-left${finger === item && !showConsent ? ' is-active' : ''}`}
                  onClick={() => {
                    setShowConsent(false);
                    setFinger(item);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="scan-images-seg" aria-label="Right hand">
              {RIGHT_FINGERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`scan-images-chip scan-images-chip-right${finger === item && !showConsent ? ' is-active' : ''}`}
                  onClick={() => {
                    setShowConsent(false);
                    setFinger(item);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`scan-images-chip scan-images-chip-consent${showConsent ? ' is-active' : ''}`}
              onClick={() => setShowConsent(true)}
              disabled={!consentImage}
              title={consentImage ? 'View consent form' : 'No consent form in this package'}
            >
              Consent
            </button>
          </div>
          <p className="process-scan-view-hint scan-images-hint">
            {showConsent
              ? 'Consent form from the zip package'
              : `${finger} · L / C / R preview`}
          </p>
        </div>

        <div className="modal-footer process-scan-footer">
          <p className="scan-images-footnote" style={{ margin: 0, flex: 1 }}>
            {totalImages > 0
              ? `${totalImages} image${totalImages === 1 ? '' : 's'} · viewing ${showConsent ? 'consent form' : `${finger} · slot ${slot}`}`
              : 'No images found in this scan package.'}
          </p>
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
