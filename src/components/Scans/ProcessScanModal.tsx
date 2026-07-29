import { useEffect, useState } from 'react';

export type ProcessScanRecord = {
  scanId: string;
  name: string;
  gender?: string;
  age?: string;
  phone?: string;
};

type ProcessScanModalProps = {
  open: boolean;
  record: ProcessScanRecord | null;
  onClose: () => void;
  onSubmit?: (record: ProcessScanRecord) => void;
  onComplete?: (record: ProcessScanRecord) => void;
  onReview?: (record: ProcessScanRecord) => void;
};

const FINGERS = ['L1', 'L2', 'L3', 'L4', 'L5', 'R1', 'R2', 'R3', 'R4', 'R5'] as const;
const LEFT_FINGERS = ['L1', 'L2', 'L3', 'L4', 'L5'] as const;
const RIGHT_FINGERS = ['R1', 'R2', 'R3', 'R4', 'R5'] as const;
const VIEW_TABS = ['L', 'C', 'R'] as const;

const MAIN_PATTERNS = [
  'Arch',
  'Loop',
  'Whorl',
  'Composite',
  'Tented Arch',
  'Radial Loop',
  'Ulnar Loop',
] as const;

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

function FingerprintPanel({
  side,
  activeFinger,
  activeView,
  onViewChange,
}: {
  side: 'left' | 'right';
  activeFinger: string;
  activeView: (typeof VIEW_TABS)[number];
  onViewChange: (view: (typeof VIEW_TABS)[number]) => void;
}) {
  const fingerBadge = side === 'left' ? activeFinger.startsWith('L') ? activeFinger : 'L1' : activeFinger.startsWith('R') ? activeFinger : 'R1';

  return (
    <div className={`process-scan-panel process-scan-panel-${side}`}>
      <div className="process-scan-panel-top">
        <span className="process-scan-finger-badge">{fingerBadge}</span>
        <div className="process-scan-view-tabs" role="tablist" aria-label={`${side} hand view`}>
          {VIEW_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeView === tab}
              className={`process-scan-view-tab${activeView === tab ? ' is-active' : ''}`}
              onClick={() => onViewChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="process-scan-image-frame">
        <PlaceholderFingerprint slot={side === 'left' ? 1 : 5} />
      </div>

      <div className="process-scan-panel-bottom">
        <span className="process-scan-corner-label">RRC</span>
        <span className="process-scan-corner-label">URC</span>
      </div>
    </div>
  );
}

export function ProcessScanModal({ open, record, onClose, onSubmit, onComplete, onReview }: ProcessScanModalProps) {
  const [finger, setFinger] = useState<string>('L1');
  const [pattern, setPattern] = useState('');
  const [leftView, setLeftView] = useState<(typeof VIEW_TABS)[number]>('C');
  const [rightView, setRightView] = useState<(typeof VIEW_TABS)[number]>('C');

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
    setPattern('');
    setLeftView('C');
    setRightView('C');
  }, [open, record?.scanId]);

  if (!open || !record) return null;

  const displayName = [record.name, record.age, record.gender, record.phone].filter(Boolean).join(' / ');

  return (
    <div
      className="modal-overlay process-scan-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel process-scan-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="process-scan-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header process-scan-header">
          <div>
            <h2 id="process-scan-title" className="modal-title">
              Processing
            </h2>
            <p className="modal-subtitle">
              Scan {record.scanId} · {record.name}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body process-scan-body">
          <FingerprintPanel side="left" activeFinger={finger} activeView={leftView} onViewChange={setLeftView} />

          <div className="process-scan-controls">
            <p className="process-scan-client-line">
              <strong>Name:</strong> {displayName}
            </p>

            <label className="form-field">
              <span className="form-label">Choose Finger</span>
              <div className="form-select-wrap">
                <select className="form-select" value={finger} onChange={(e) => setFinger(e.target.value)}>
                  {FINGERS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <span className="form-select-chevron" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </div>
            </label>

            <div className="process-scan-pattern-block">
              <p className="process-scan-section-label">Main Pattern</p>
              <label className="form-field">
                <div className="form-select-wrap">
                  <select className="form-select" value={pattern} onChange={(e) => setPattern(e.target.value)}>
                    <option value="">Select</option>
                    {MAIN_PATTERNS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <span className="form-select-chevron" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </div>
              </label>
            </div>

            <button
              type="button"
              className="btn-pill-primary process-scan-submit"
              onClick={() => onSubmit?.(record)}
            >
              Submit
            </button>

            <div className="process-scan-qc">
              <p className="process-scan-section-label">QC - Finger Prints</p>
              <div className="process-scan-qc-row">
                {LEFT_FINGERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`process-scan-qc-btn process-scan-qc-left${finger === item ? ' is-active' : ''}`}
                    onClick={() => setFinger(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="process-scan-qc-row">
                {RIGHT_FINGERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`process-scan-qc-btn process-scan-qc-right${finger === item ? ' is-active' : ''}`}
                    onClick={() => setFinger(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <FingerprintPanel side="right" activeFinger={finger} activeView={rightView} onViewChange={setRightView} />
        </div>

        <div className="modal-footer process-scan-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="scans-action-btn"
            onClick={() => {
              onReview?.(record);
              onClose();
            }}
          >
            To be reviewed
          </button>
          <button
            type="button"
            className="scans-action-btn scans-action-export"
            onClick={() => {
              onComplete?.(record);
              onClose();
            }}
          >
            Completed
          </button>
        </div>
      </div>
    </div>
  );
}
