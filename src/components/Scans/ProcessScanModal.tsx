import { useEffect, useState } from 'react';

export type ProcessScanMode = 'preprocess' | 'process' | 'verify';

export type ProcessScanRecord = {
  scanId: string;
  name: string;
  gender?: string;
  age?: string;
  phone?: string;
  defaultPattern?: string;
  defaultSubPattern?: string;
  urc?: number;
  rrc?: number;
  lfo?: number;
};

/** Pattern / ridge-count payload returned from the fingerprint modal. */
export type ProcessScanPayload = ProcessScanRecord & {
  mainPattern: string;
  subPattern: string;
  urc: number;
  rrc: number;
  lfo: number;
  finger: string;
};

type ProcessScanModalProps = {
  open: boolean;
  mode?: ProcessScanMode;
  record: ProcessScanRecord | null;
  onClose: () => void;
  onAccept?: (payload: ProcessScanPayload) => void;
  onReject?: (payload: ProcessScanPayload) => void;
  onComplete?: (payload: ProcessScanPayload) => void;
  onReview?: (payload: ProcessScanPayload) => void;
};

const LEFT_FINGERS = ['L1', 'L2', 'L3', 'L4', 'L5'] as const;
const RIGHT_FINGERS = ['R1', 'R2', 'R3', 'R4', 'R5'] as const;
const VIEW_TABS = ['L', 'C', 'R'] as const;

const VIEW_LABELS: Record<(typeof VIEW_TABS)[number], string> = {
  L: 'Left side',
  C: 'Centre',
  R: 'Right side',
};

const MAIN_PATTERNS = [
  'Arch',
  'Loop',
  'Whorl',
  'Composite',
  'Tented Arch',
  'Radial Loop',
  'Ulnar Loop',
] as const;

const SUB_PATTERNS = [
  'Plain Arch',
  'Tented Arch',
  'Ulnar Loop',
  'Radial Loop',
  'Plain Whorl',
  'Double Loop',
  'Central Pocket',
  'Accidental',
] as const;

const modeTitles: Record<ProcessScanMode, string> = {
  preprocess: 'Preprocess',
  process: 'Processing',
  verify: 'Verify',
};

function PlaceholderFingerprint({
  slot,
  view,
}: {
  slot: number;
  view: (typeof VIEW_TABS)[number];
}) {
  const ridges = 7 + (slot % 4);
  const shift = view === 'L' ? -14 : view === 'R' ? 14 : 0;
  const clipX = view === 'L' ? 0 : view === 'R' ? 28 : 10;
  const clipW = view === 'C' ? 60 : 52;

  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" aria-hidden="true">
      <defs>
        <clipPath id={`fp-clip-${slot}-${view}`}>
          <rect x={clipX} y="4" width={clipW} height="72" rx="8" />
        </clipPath>
      </defs>
      <g clipPath={`url(#fp-clip-${slot}-${view})`} transform={`translate(${shift} 0)`}>
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
      </g>
      <text x="40" y="76" textAnchor="middle" fontSize="7" fill="#868e96" fontWeight="600">
        {VIEW_LABELS[view]}
      </text>
    </svg>
  );
}

function FingerprintPanel({
  side,
  activeFinger,
  activeView,
  onViewChange,
  showCornerValues,
  urc,
  rrc,
}: {
  side: 'left' | 'right';
  activeFinger: string;
  activeView: (typeof VIEW_TABS)[number];
  onViewChange: (view: (typeof VIEW_TABS)[number]) => void;
  showCornerValues: boolean;
  urc: string;
  rrc: string;
}) {
  const fingerBadge =
    side === 'left'
      ? activeFinger.startsWith('L')
        ? activeFinger
        : 'L1'
      : activeFinger.startsWith('R')
        ? activeFinger
        : 'R1';

  return (
    <div className={`process-scan-panel process-scan-panel-${side}`}>
      <div className="process-scan-panel-top">
        <span className="process-scan-finger-badge">{fingerBadge}</span>
        <div className="process-scan-view-tabs" role="tablist" aria-label={`${side} hand print side`}>
          {VIEW_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeView === tab}
              title={VIEW_LABELS[tab]}
              className={`process-scan-view-tab${activeView === tab ? ' is-active' : ''}`}
              onClick={() => onViewChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="process-scan-image-frame">
        <PlaceholderFingerprint slot={side === 'left' ? 1 : 5} view={activeView} />
      </div>

      <div className="process-scan-panel-bottom">
        <span className="process-scan-corner-label" title="Radial Ridge Count">
          RRC{showCornerValues ? `: ${rrc || '0'}` : ''}
        </span>
        <span className="process-scan-corner-label" title="Ulnar Ridge Count">
          URC{showCornerValues ? `: ${urc || '0'}` : ''}
        </span>
      </div>
    </div>
  );
}

export function ProcessScanModal({
  open,
  mode = 'process',
  record,
  onClose,
  onAccept,
  onReject,
  onComplete,
  onReview,
}: ProcessScanModalProps) {
  const [finger, setFinger] = useState('L1');
  const [leftView, setLeftView] = useState<(typeof VIEW_TABS)[number]>('C');
  const [rightView, setRightView] = useState<(typeof VIEW_TABS)[number]>('C');
  const [mainPattern, setMainPattern] = useState('');
  const [subPattern, setSubPattern] = useState('');
  const [urc, setUrc] = useState('0');
  const [rrc, setRrc] = useState('0');

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
    if (!open || !record) return;
    setFinger('L1');
    setLeftView('C');
    setRightView('C');
    setMainPattern(record.defaultPattern || '');
    setSubPattern(record.defaultSubPattern || '');
    // Preprocess always stores ridge / LFO counts as 0
    if (mode === 'preprocess') {
      setUrc('0');
      setRrc('0');
    } else {
      setUrc(String(record.urc ?? 0));
      setRrc(String(record.rrc ?? 0));
    }
  }, [open, record, mode]);

  if (!open || !record) return null;

  const displayName = [record.name, record.age, record.gender, record.phone].filter(Boolean).join(' / ');
  const showRidgeInputs = mode === 'process' || mode === 'verify';

  const buildPayload = (): ProcessScanPayload => ({
    ...record,
    mainPattern,
    subPattern,
    finger,
    // Preprocess: force URC / RRC / LFO to 0
    urc: mode === 'preprocess' ? 0 : Number(urc) || 0,
    rrc: mode === 'preprocess' ? 0 : Number(rrc) || 0,
    lfo: mode === 'preprocess' ? 0 : record.lfo ?? 0,
  });

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
              {modeTitles[mode]}
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
          <FingerprintPanel
            side="left"
            activeFinger={finger}
            activeView={leftView}
            onViewChange={setLeftView}
            showCornerValues={showRidgeInputs}
            urc={urc}
            rrc={rrc}
          />

          <div className="process-scan-controls">
            <p className="process-scan-client-line">
              <strong>Name:</strong> {displayName}
            </p>

            <p className="process-scan-view-hint">
              L / C / R = left, centre, and right sides of the finger print
            </p>

            <label className="form-field process-scan-pattern-block">
              <span className="form-label process-scan-section-label">Main Pattern</span>
              <div className="form-select-wrap">
                <select
                  className="form-select"
                  value={mainPattern}
                  onChange={(e) => setMainPattern(e.target.value)}
                >
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

            <label className="form-field process-scan-pattern-block">
              <span className="form-label process-scan-section-label">Sub Pattern</span>
              <div className="form-select-wrap">
                <select
                  className="form-select"
                  value={subPattern}
                  onChange={(e) => setSubPattern(e.target.value)}
                >
                  <option value="">Select</option>
                  {SUB_PATTERNS.map((item) => (
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

            {showRidgeInputs ? (
              <div className="process-scan-ridge-grid">
                <label className="form-field">
                  <span className="form-label">URC</span>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={urc}
                    onChange={(e) => setUrc(e.target.value)}
                    aria-label="Ulnar Ridge Count"
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">RRC</span>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={rrc}
                    onChange={(e) => setRrc(e.target.value)}
                    aria-label="Radial Ridge Count"
                  />
                </label>
              </div>
            ) : (
              <p className="process-scan-preprocess-note">
                URC, RRC and LFO are stored as 0 in preprocess. Enter ridge counts in Process.
              </p>
            )}

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

          <FingerprintPanel
            side="right"
            activeFinger={finger}
            activeView={rightView}
            onViewChange={setRightView}
            showCornerValues={showRidgeInputs}
            urc={urc}
            rrc={rrc}
          />
        </div>

        <div className="modal-footer process-scan-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Close
          </button>

          {mode === 'preprocess' ? (
            <>
              <button
                type="button"
                className="scans-action-btn scans-action-danger"
                onClick={() => {
                  onReject?.(buildPayload());
                  onClose();
                }}
              >
                Reject
              </button>
              <button
                type="button"
                className="scans-action-btn scans-action-export"
                onClick={() => {
                  onAccept?.(buildPayload());
                  onClose();
                }}
              >
                Accept
              </button>
            </>
          ) : null}

          {mode === 'process' ? (
            <>
              <button
                type="button"
                className="scans-action-btn"
                onClick={() => {
                  onReview?.(buildPayload());
                  onClose();
                }}
              >
                To be reviewed
              </button>
              <button
                type="button"
                className="scans-action-btn scans-action-export"
                onClick={() => {
                  onComplete?.(buildPayload());
                  onClose();
                }}
              >
                Completed
              </button>
            </>
          ) : null}

          {mode === 'verify' ? (
            <>
              <button
                type="button"
                className="scans-action-btn scans-action-danger"
                onClick={() => {
                  onReject?.(buildPayload());
                  onClose();
                }}
              >
                Rejected
              </button>
              <button
                type="button"
                className="scans-action-btn scans-action-export"
                onClick={() => {
                  onComplete?.(buildPayload());
                  onClose();
                }}
              >
                Completed
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
