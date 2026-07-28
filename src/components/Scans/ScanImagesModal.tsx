import { useEffect, useMemo, useState } from 'react';
import type { ScanRecord } from './scanTypes';
import { flattenScanImages, groupScanImages, organizeByHand, type HandTabId } from './scanImages';

type ScanImagesModalProps = {
  open: boolean;
  record: ScanRecord | null;
  onClose: () => void;
};

function PlaceholderFingerprint({ slot }: { slot: number }) {
  const ridges = 7 + (slot % 4);
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" aria-hidden="true">
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

export function ScanImagesModal({ open, record, onClose }: ScanImagesModalProps) {
  const [activeHand, setActiveHand] = useState<HandTabId>('left');
  const [activeIndex, setActiveIndex] = useState(0);

  const allGroups = useMemo(() => groupScanImages(record?.images ?? []), [record?.images]);
  const handViews = useMemo(() => organizeByHand(allGroups), [allGroups]);
  const activeView = handViews.find((view) => view.id === activeHand) ?? handViews[0];
  const visibleGroups = activeView?.groups ?? [];
  const flatImages = useMemo(() => flattenScanImages(visibleGroups), [visibleGroups]);
  const hasRealImages = flatImages.length > 0;
  const activeImage = hasRealImages ? flatImages[activeIndex] : null;

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
    const first = handViews[0]?.id ?? 'left';
    setActiveHand(first);
    setActiveIndex(0);
  }, [open, record?.id, handViews]);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeHand]);

  if (!open || !record) return null;

  const clientLabel = record.details.name || 'Unnamed scan';
  const totalImages = record.images?.length ?? 0;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel scan-images-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-images-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="scan-images-title" className="modal-title">
              Scan images
            </h2>
            <p className="modal-subtitle">
              {record.scanId} · {clientLabel} · {record.fileName}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body scan-images-body">
          <div className="scan-images-preview">
            <p className="scan-images-preview-label">Preview</p>
            <div className="scan-images-preview-frame">
              {hasRealImages && activeImage ? (
                <img src={activeImage.url} alt={activeImage.label} className="scan-images-preview-img" />
              ) : (
                <PlaceholderFingerprint slot={activeIndex} />
              )}
            </div>
            <p className="scan-images-preview-meta">
              {hasRealImages && activeImage
                ? activeImage.label
                : `No images for ${activeView?.label ?? 'this hand'}`}
            </p>
          </div>

          <div className="scan-images-sets">
            {handViews.length > 0 && (
              <div className="scan-images-hand-tabs" role="tablist" aria-label="Select hand">
                {handViews.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    role="tab"
                    aria-selected={activeHand === view.id}
                    className={`scan-images-hand-tab${activeHand === view.id ? ' is-active' : ''}`}
                    onClick={() => setActiveHand(view.id)}
                  >
                    {view.label}
                    <span className="scan-images-hand-tab-count">
                      {view.groups.reduce((sum, group) => sum + group.images.length, 0)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {hasRealImages ? (
              visibleGroups.map((group) => (
                <section key={group.key} className="scan-images-set">
                  <h3 className="scan-images-set-label">
                    {group.label}
                  </h3>
                  <div className="scan-images-set-grid">
                    {group.images.map((image) => {
                      const index = flatImages.findIndex((item) => item.url === image.url);
                      return (
                        <button
                          key={image.url}
                          type="button"
                          className={`scan-fp-picker${activeIndex === index ? ' is-selected' : ''}`}
                          onClick={() => setActiveIndex(index)}
                          aria-label={image.label}
                        >
                          <div className="scan-fp-thumb">
                            <img src={image.url} alt={image.label} className="scan-images-thumb-img" />
                          </div>
                          <span className="scan-images-thumb-caption">{image.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))
            ) : (
              <p className="scan-images-empty">
                No fingerprint images for the {activeView?.label?.toLowerCase() ?? 'selected'} hand.
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer scan-images-footer">
          <p className="scan-images-footnote">
            {totalImages > 0
              ? `${totalImages} image${totalImages === 1 ? '' : 's'} extracted from the zip package.`
              : 'Fingerprint previews are shown when images are extracted from the zip.'}
          </p>
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
