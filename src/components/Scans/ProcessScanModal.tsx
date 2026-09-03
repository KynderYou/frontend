import { useEffect, useMemo, useState } from 'react';
import {
  ALL_FINGERS,
  MAIN_FINGERPRINT_PATTERNS,
  normalizeMainPattern,
  subPatternsForMain,
} from './fingerprintPatterns';
import { buildFingerViewIndex, findFingerViewImage, panelFingerForSide, type FingerViewTab } from './scanImages';
import type { ScanImage } from './scanTypes';

const LEFT_FINGERS = ['L1', 'L2', 'L3', 'L4', 'L5'] as const;
const RIGHT_FINGERS = ['R1', 'R2', 'R3', 'R4', 'R5'] as const;

type FingerPattern = { main: string; sub: string };

export type ProcessScanMode = 'preprocess' | 'process' | 'verify';

export type ProcessScanRecord = {
  scanId: string;
  name: string;
  gender?: string;
  age?: string;
  phone?: string;
  defaultPattern?: string;
  defaultSubPattern?: string;
  defaultFinger?: string;
  urc?: number;
  rrc?: number;
  lfo?: number;
  flaggedX?: boolean;
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
  images?: ScanImage[];
  imagesLoading?: boolean;
  onClose: () => void;
  onAccept?: (payload: ProcessScanPayload) => void;
  onReject?: (payload: ProcessScanPayload) => void;
  onComplete?: (payload: ProcessScanPayload) => void;
  onReview?: (payload: ProcessScanPayload) => void;
};

const VIEW_TABS = ['L', 'C', 'R'] as const satisfies readonly FingerViewTab[];

const VIEW_LABELS: Record<(typeof VIEW_TABS)[number], string> = {
  L: 'Left side',
  C: 'Centre',
  R: 'Right side',
};

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
    <svg className="process-scan-fingerprint-svg" viewBox="0 0 80 80" aria-hidden="true">
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

function FingerprintPreview({
  image,
  loading,
  slot,
  view,
}: {
  image?: ScanImage;
  loading?: boolean;
  slot: number;
  view: FingerViewTab;
}) {
  if (loading) {
    return <p className="process-scan-image-loading">Loading fingerprint…</p>;
  }
  if (image) {
    return (
      <img
        key={`${image.name}-${view}`}
        src={image.url}
        alt={image.label}
        className="process-scan-fingerprint-img"
      />
    );
  }
  return <PlaceholderFingerprint slot={slot} view={view} />;
}

function FingerprintPanel({
  side,
  activeFinger,
  activeView,
  onViewChange,
  showCornerValues,
  urc,
  rrc,
  images,
  imagesLoading,
  imageIndex,
}: {
  side: 'left' | 'right';
  activeFinger: string;
  activeView: FingerViewTab;
  onViewChange: (view: FingerViewTab) => void;
  showCornerValues: boolean;
  urc: string;
  rrc: string;
  images?: ScanImage[];
  imagesLoading?: boolean;
  imageIndex?: Map<string, ScanImage>;
}) {
  const fingerBadge = panelFingerForSide(side, activeFinger);
  const activeImage = findFingerViewImage(images ?? [], fingerBadge, activeView, imageIndex);
  const slot = Number.parseInt(fingerBadge.slice(1), 10) || 1;

  return (
    <div className={`process-scan-panel process-scan-panel-${side}`}>
      <div className="process-scan-image-frame">
        <FingerprintPreview
          image={activeImage}
          loading={imagesLoading}
          slot={slot}
          view={activeView}
        />

        <div className="process-scan-panel-overlay process-scan-panel-overlay-top">
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

        <div className="process-scan-panel-overlay process-scan-panel-overlay-bottom">
          <span className="process-scan-corner-label" title="Radial Ridge Count">
            RRC{showCornerValues ? `: ${rrc || '0'}` : ''}
          </span>
          <span className="process-scan-corner-label" title="Ulnar Ridge Count">
            URC{showCornerValues ? `: ${urc || '0'}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProcessScanModal({
  open,
  mode = 'process',
  record,
  images,
  imagesLoading = false,
  onClose,
  onAccept,
  onReject,
  onComplete,
  onReview,
}: ProcessScanModalProps) {
  const [finger, setFinger] = useState('L1');
  const [leftView, setLeftView] = useState<FingerViewTab>('C');
  const [rightView, setRightView] = useState<FingerViewTab>('C');
  const [mainPattern, setMainPattern] = useState('');
  const [subPattern, setSubPattern] = useState('');
  const [fingerPatterns, setFingerPatterns] = useState<Record<string, FingerPattern>>({});
  const [urc, setUrc] = useState('0');
  const [rrc, setRrc] = useState('0');
  const [lfo, setLfo] = useState('0');

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

  const scanKey = record?.scanId ?? null;

  useEffect(() => {
    if (!open || !record || !scanKey) return;
    setFinger(record.defaultFinger || 'L1');
    setLeftView('C');
    setRightView('C');
    setMainPattern(normalizeMainPattern(record.defaultPattern));
    setSubPattern(record.defaultSubPattern || '');
    setFingerPatterns({});
    setUrc(String(record.urc ?? 0));
    setRrc(String(record.rrc ?? 0));
    setLfo(String(record.lfo ?? 0));
  }, [open, scanKey, mode]);

  const subPatternOptions = useMemo(() => subPatternsForMain(mainPattern), [mainPattern]);
  const imageIndex = useMemo(() => buildFingerViewIndex(images ?? []), [images]);

  useEffect(() => {
    if (!mainPattern || subPatternOptions.includes(subPattern)) return;
    setSubPattern('');
  }, [mainPattern, subPattern, subPatternOptions]);

  if (!open || !record) return null;

  const displayName = [record.name, record.age, record.gender, record.phone].filter(Boolean).join(' / ');
  const isPreprocess = mode === 'preprocess';
  const isProcess = mode === 'process';
  const isVerifyReadOnly = mode === 'verify';
  const showPatternFields = isPreprocess || isProcess || isVerifyReadOnly;
  const showRidgeFields = isProcess;
  const showCornerValues = isProcess || isVerifyReadOnly;
  const showFlagBanner = isVerifyReadOnly && record.flaggedX;
  const showQcFingers = isPreprocess || isProcess;

  const currentFingerPattern = (): FingerPattern => ({
    main: mainPattern,
    sub: subPattern,
  });

  const mergedFingerPatterns = (): Record<string, FingerPattern> => ({
    ...fingerPatterns,
    [finger]: currentFingerPattern(),
  });

  const fingerPatternComplete = (fingerId: string, patterns = mergedFingerPatterns()) => {
    const entry = patterns[fingerId];
    return Boolean(entry?.main && entry?.sub);
  };

  const allFingersComplete = ALL_FINGERS.every((fingerId) => fingerPatternComplete(fingerId));

  const fingerIndex = (fingerId: string) =>
    ALL_FINGERS.indexOf(fingerId as (typeof ALL_FINGERS)[number]);

  const selectFinger = (nextFinger: string) => {
    const updated: Record<string, FingerPattern> = {
      ...fingerPatterns,
      [finger]: currentFingerPattern(),
    };
    setFingerPatterns(updated);
    setFinger(nextFinger);
    const saved = updated[nextFinger];
    setMainPattern(saved?.main ? normalizeMainPattern(saved.main) : '');
    setSubPattern(saved?.sub ?? '');
  };

  const handleNextFinger = () => {
    if (!mainPattern || !subPattern) return;
    const idx = fingerIndex(finger);
    if (idx < 0 || idx >= ALL_FINGERS.length - 1) return;
    selectFinger(ALL_FINGERS[idx + 1]);
  };

  const buildPayload = (): ProcessScanPayload => {
    const patterns = mergedFingerPatterns();
    const primary = patterns.L1 ?? currentFingerPattern();
    return {
      ...record,
      mainPattern: primary.main,
      subPattern: primary.sub,
      finger: 'L1',
      urc: isPreprocess ? 0 : Number(urc) || 0,
      rrc: isPreprocess ? 0 : Number(rrc) || 0,
      lfo: isPreprocess ? 0 : Number(lfo) || 0,
    };
  };

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
            showCornerValues={showCornerValues}
            urc={urc}
            rrc={rrc}
            images={images}
            imagesLoading={imagesLoading}
            imageIndex={imageIndex}
          />

          <div className="process-scan-controls">
            <p className="process-scan-client-line">
              <strong>Name:</strong> {displayName}
            </p>

            {isVerifyReadOnly ? (
              <p className="process-scan-view-hint">
                Review saved preprocess and process data — fields cannot be edited during verification
              </p>
            ) : isPreprocess ? (
              <p className="process-scan-view-hint">
                Select each finger below · fill main/sub pattern · use Next to move through all 10 fingers
              </p>
            ) : (
              <p className="process-scan-view-hint">
                Verify main/sub pattern and enter URC, RRC, and LFO ridge counts
              </p>
            )}

            {showFlagBanner ? (
              <div className="process-scan-flag-banner" role="status">
                <strong>Flag X — Complex scan</strong>
                <span>This scan must be followed with CAB before counselling. Do not proceed without CAB support.</span>
              </div>
            ) : null}

            {showPatternFields ? (
              <>
                <div className="process-scan-pattern-block">
                  <p className="process-scan-section-label">Main Pattern</p>
                  {isVerifyReadOnly ? (
                    <p className="process-scan-pattern-value">{mainPattern || '—'}</p>
                  ) : (
                    <label className="form-field">
                      <div className="form-select-wrap">
                        <select
                          className="form-select"
                          value={mainPattern}
                          onChange={(e) => setMainPattern(e.target.value)}
                        >
                          <option value="">Select</option>
                          {MAIN_FINGERPRINT_PATTERNS.map((item) => (
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
                  )}
                </div>

                <div className="process-scan-pattern-block">
                  <p className="process-scan-section-label">Sub Pattern</p>
                  {isVerifyReadOnly ? (
                    <p className="process-scan-pattern-value">{subPattern || '—'}</p>
                  ) : (
                    <label className="form-field">
                      <div className="form-select-wrap">
                        <select
                          className="form-select"
                          value={subPattern}
                          onChange={(e) => setSubPattern(e.target.value)}
                          disabled={!mainPattern}
                        >
                          <option value="">Select</option>
                          {subPatternOptions.map((item) => (
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
                  )}
                </div>
              </>
            ) : null}

            {isPreprocess ? (
              <div className="process-scan-ridge-grid process-scan-ridge-grid-readonly">
                <div className="process-scan-pattern-block">
                  <p className="process-scan-section-label">URC</p>
                  <p className="process-scan-pattern-value">0</p>
                </div>
                <div className="process-scan-pattern-block">
                  <p className="process-scan-section-label">RRC</p>
                  <p className="process-scan-pattern-value">0</p>
                </div>
                <div className="process-scan-pattern-block">
                  <p className="process-scan-section-label">LFO</p>
                  <p className="process-scan-pattern-value">0</p>
                </div>
              </div>
            ) : null}

            {showRidgeFields ? (
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
                <label className="form-field">
                  <span className="form-label">LFO</span>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={lfo}
                    onChange={(e) => setLfo(e.target.value)}
                    aria-label="LFO count"
                  />
                </label>
              </div>
            ) : null}

            {showQcFingers ? (
              <>
                {isPreprocess ? (
                  <button
                    type="button"
                    className="scans-action-btn process-scan-next-btn"
                    disabled={!mainPattern || !subPattern || finger === 'R5'}
                    onClick={handleNextFinger}
                  >
                    Next · {fingerIndex(finger) >= 0 ? ALL_FINGERS[fingerIndex(finger) + 1] ?? 'Done' : 'Next'}
                  </button>
                ) : null}
                <div className="process-scan-qc">
                <p className="process-scan-section-label">
                  QC - Finger Prints · {finger}
                  {fingerPatternComplete(finger) ? (
                    <span className="process-scan-qc-progress"> · {ALL_FINGERS.filter((id) => fingerPatternComplete(id)).length}/10 done</span>
                  ) : null}
                </p>
                <div className="process-scan-qc-row">
                  {LEFT_FINGERS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`process-scan-qc-btn process-scan-qc-left${finger === item ? ' is-active' : ''}${fingerPatternComplete(item) ? ' is-filled' : ''}`}
                      onClick={() => selectFinger(item)}
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
                      className={`process-scan-qc-btn process-scan-qc-right${finger === item ? ' is-active' : ''}${fingerPatternComplete(item) ? ' is-filled' : ''}`}
                      onClick={() => selectFinger(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                </div>
              </>
            ) : null}

            {isVerifyReadOnly ? (
              <div className="process-scan-ridge-grid process-scan-ridge-grid-readonly">
                <div className="process-scan-pattern-block">
                  <p className="process-scan-section-label">URC</p>
                  <p className="process-scan-pattern-value">{urc}</p>
                </div>
                <div className="process-scan-pattern-block">
                  <p className="process-scan-section-label">RRC</p>
                  <p className="process-scan-pattern-value">{rrc}</p>
                </div>
                <div className="process-scan-pattern-block">
                  <p className="process-scan-section-label">LFO</p>
                  <p className="process-scan-pattern-value">{lfo}</p>
                </div>
              </div>
            ) : null}
          </div>

          <FingerprintPanel
            side="right"
            activeFinger={finger}
            activeView={rightView}
            onViewChange={setRightView}
            showCornerValues={showCornerValues}
            urc={urc}
            rrc={rrc}
            images={images}
            imagesLoading={imagesLoading}
            imageIndex={imageIndex}
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
                disabled={!allFingersComplete}
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
