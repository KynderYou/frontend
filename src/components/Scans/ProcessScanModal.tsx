import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
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
type FingerRidges = { urc: string; rrc: string; lfo: string };
type FingerEntry = FingerPattern & FingerRidges;

export type ScanFingerPayload = {
  finger: string;
  mainPattern: string;
  subPattern: string;
  urc: number;
  rrc: number;
  lfo: number;
};

export type ProcessScanMode = 'preprocess' | 'process' | 'review';

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
  initialFingers?: ScanFingerPayload[];
};

/** Pattern / ridge-count payload returned from the fingerprint modal. */
export type ProcessScanPayload = ProcessScanRecord & {
  fingers: ScanFingerPayload[];
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
  onConfirmFlag?: (payload: ProcessScanPayload) => void;
  onRejectReview?: (payload: ProcessScanPayload, reason: string) => void;
};

type PendingConfirm = { kind: 'reject' } | { kind: 'flag'; proceed: () => void };

const RIDGE_MIN = 2;
const RIDGE_MAX = 40;

/** Mirrors the backend range check: whole number from 2 to 40. */
function isValidRidge(value: string): boolean {
  if (!/^\d{1,2}$/.test(value)) return false;
  const count = Number(value);
  return count >= RIDGE_MIN && count <= RIDGE_MAX;
}

function ridgeDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 2);
}

function RidgeInput({
  label,
  ariaLabel,
  value,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const invalid = value !== '' && !isValidRidge(value);
  return (
    <label className={`form-field${isValidRidge(value) ? ' is-ridge-filled' : ''}`}>
      <span className="form-label">{label}</span>
      <input
        className={`form-input${invalid ? ' is-invalid' : ''}`}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        placeholder={`${RIDGE_MIN}–${RIDGE_MAX}`}
        value={value}
        onChange={(e) => onChange(ridgeDigits(e.target.value))}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
      />
      {invalid ? (
        <span className="form-field-error">
          {RIDGE_MIN}–{RIDGE_MAX} only
        </span>
      ) : null}
    </label>
  );
}

/** Mirrors the backend Flag X rule: (URC + 3) < RRC. */
function isFlaggedRidge(urc: string, rrc: string): boolean {
  if (urc.trim() === '' || rrc.trim() === '') return false;
  return Number(urc) + 3 < Number(rrc);
}

const VIEW_TABS = ['L', 'C', 'R'] as const satisfies readonly FingerViewTab[];

const VIEW_LABELS: Record<(typeof VIEW_TABS)[number], string> = {
  L: 'Left side',
  C: 'Centre',
  R: 'Right side',
};

const EMPTY_RIDGES: FingerRidges = { urc: '', rrc: '', lfo: '' };

function fingerPayloadFromEntry(fingerId: string, entry: FingerEntry): ScanFingerPayload {
  return {
    finger: fingerId,
    mainPattern: entry.main,
    subPattern: entry.sub,
    urc: Number(entry.urc) || 0,
    rrc: Number(entry.rrc) || 0,
    lfo: Number(entry.lfo) || 0,
  };
}

function initialFingerMap(record: ProcessScanRecord): Record<string, FingerEntry> {
  const map: Record<string, FingerEntry> = {};
  for (const item of record.initialFingers ?? []) {
    map[item.finger] = {
      main: normalizeMainPattern(item.mainPattern),
      sub: item.subPattern ?? '',
      urc: String(item.urc ?? 0),
      rrc: String(item.rrc ?? 0),
      lfo: String(item.lfo ?? 0),
    };
  }
  if (Object.keys(map).length === 0 && (record.defaultPattern || record.defaultSubPattern)) {
    map.L1 = {
      main: normalizeMainPattern(record.defaultPattern),
      sub: record.defaultSubPattern ?? '',
      urc: String(record.urc ?? 0),
      rrc: String(record.rrc ?? 0),
      lfo: String(record.lfo ?? 0),
    };
  }
  return map;
}

const modeTitles: Record<ProcessScanMode, string> = {
  preprocess: 'Preprocess',
  process: 'Processing',
  review: 'Flag Review',
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
    return <ZoomableFingerprint key={`${image.name}-${view}`} image={image} />;
  }
  return <PlaceholderFingerprint slot={slot} view={view} />;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.5;
const DOUBLE_CLICK_ZOOM = 2.5;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

/** Fingerprint image with in-place zoom (buttons, wheel, double-click) and drag-to-pan. */
function ZoomableFingerprint({ image }: { image: ScanImage }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const zoomRef = useRef(MIN_ZOOM);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const clampOffset = useCallback((x: number, y: number, z: number) => {
    const frame = frameRef.current;
    if (!frame || z <= MIN_ZOOM) return { x: 0, y: 0 };
    const maxX = ((z - 1) * frame.clientWidth) / 2;
    const maxY = ((z - 1) * frame.clientHeight) / 2;
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  }, []);

  const applyZoom = useCallback(
    (next: number) => {
      const z = clampZoom(next);
      zoomRef.current = z;
      setZoom(z);
      setOffset((prev) => clampOffset(prev.x, prev.y, z));
    },
    [clampOffset],
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    };
    frame.addEventListener('wheel', onWheel, { passive: false });
    return () => frame.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  const zoomed = zoom > MIN_ZOOM;

  return (
    <div
      ref={frameRef}
      className={`process-scan-zoom-frame${zoomed ? ' is-zoomed' : ''}`}
      onDoubleClick={() => applyZoom(zoomed ? MIN_ZOOM : DOUBLE_CLICK_ZOOM)}
      onPointerDown={(e) => {
        if (!zoomed || e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      }}
      onPointerMove={(e) => {
        const drag = dragRef.current;
        if (!drag) return;
        setOffset(clampOffset(drag.ox + e.clientX - drag.x, drag.oy + e.clientY - drag.y, zoom));
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
    >
      <img
        src={image.url}
        alt={image.label}
        className="process-scan-fingerprint-img"
        draggable={false}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      />
      <div
        className="process-scan-zoom-controls"
        onDoubleClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => applyZoom(zoom - ZOOM_STEP)}
        >
          −
        </button>
        <button type="button" className="process-scan-zoom-level" title="Reset zoom" onClick={() => applyZoom(MIN_ZOOM)}>
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => applyZoom(zoom + ZOOM_STEP)}
        >
          +
        </button>
      </div>
    </div>
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
  const rrcLabel = (
    <span key="rrc" className="process-scan-corner-label" title="Radial Ridge Count">
      RRC{showCornerValues ? `: ${rrc || '0'}` : ''}
    </span>
  );
  const urcLabel = (
    <span key="urc" className="process-scan-corner-label" title="Ulnar Ridge Count">
      URC{showCornerValues ? `: ${urc || '0'}` : ''}
    </span>
  );
  const cornerLabels = side === 'right' ? [urcLabel, rrcLabel] : [rrcLabel, urcLabel];

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
          {cornerLabels}
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
  onConfirmFlag,
  onRejectReview,
}: ProcessScanModalProps) {
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [finger, setFinger] = useState('L1');
  const [leftView, setLeftView] = useState<FingerViewTab>('C');
  const [rightView, setRightView] = useState<FingerViewTab>('C');
  const [mainPattern, setMainPattern] = useState('');
  const [subPattern, setSubPattern] = useState('');
  const [fingerEntries, setFingerEntries] = useState<Record<string, FingerEntry>>({});
  const [urc, setUrc] = useState('0');
  const [rrc, setRrc] = useState('0');
  const [lfo, setLfo] = useState('0');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (pendingConfirm) setPendingConfirm(null);
      else onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, pendingConfirm]);

  const scanKey = record?.scanId ?? null;

  useEffect(() => {
    if (!open || !record || !scanKey) return;
    const seeded = initialFingerMap(record);
    // Preprocess stores ridge defaults as 0 — clear those so green only appears after real URC/RRC are entered.
    if (mode !== 'preprocess') {
      for (const fingerId of Object.keys(seeded)) {
        const entry = seeded[fingerId];
        if (entry.urc === '0' && entry.rrc === '0') {
          seeded[fingerId] = { ...entry, urc: '', rrc: '', lfo: '' };
        }
      }
    }
    const startFinger = record.defaultFinger && seeded[record.defaultFinger] ? record.defaultFinger : 'L1';
    const startEntry = seeded[startFinger] ?? {
      main: normalizeMainPattern(record.defaultPattern),
      sub: record.defaultSubPattern ?? '',
      ...EMPTY_RIDGES,
    };
    setFinger(startFinger);
    setLeftView('C');
    setRightView('C');
    setFingerEntries(seeded);
    setMainPattern(startEntry.main);
    setSubPattern(startEntry.sub);
    setUrc(startEntry.urc);
    setRrc(startEntry.rrc);
    setLfo(startEntry.lfo);
  }, [open, scanKey, mode, record]);

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
  const isReview = mode === 'review';
  const showRidgeFields = isProcess || isReview;
  const showCornerValues = showRidgeFields;
  const showFlaggedFingers = showRidgeFields;

  const currentFingerEntry = (): FingerEntry => ({
    main: mainPattern,
    sub: subPattern,
    urc,
    rrc,
    lfo,
  });

  const mergedFingerEntries = (): Record<string, FingerEntry> => ({
    ...fingerEntries,
    [finger]: currentFingerEntry(),
  });

  const fingerPatternComplete = (fingerId: string, entries = mergedFingerEntries()) => {
    const entry = entries[fingerId];
    return Boolean(entry?.main && entry?.sub);
  };

  const ridgeCountsFilled = (entry?: FingerEntry | null) => {
    if (!entry) return false;
    return isValidRidge(entry.urc) && isValidRidge(entry.rrc);
  };

  /** Process step: patterns + URC + RRC (same green chip as preprocess after Next). */
  const fingerProcessComplete = (fingerId: string, entries = mergedFingerEntries()) => {
    const entry = entries[fingerId];
    return fingerPatternComplete(fingerId, entries) && ridgeCountsFilled(entry);
  };

  const fingerFilled = (fingerId: string) =>
    isPreprocess ? fingerPatternComplete(fingerId) : fingerProcessComplete(fingerId);

  const fingerFlagged = (fingerId: string) => {
    if (!showFlaggedFingers) return false;
    const entry = mergedFingerEntries()[fingerId];
    return Boolean(entry && isFlaggedRidge(entry.urc, entry.rrc));
  };
  const flaggedFingers = ALL_FINGERS.filter((fingerId) => fingerFlagged(fingerId));
  const showFlagBanner = isReview && flaggedFingers.length > 0;

  const allFingersComplete = isPreprocess
    ? ALL_FINGERS.every((fingerId) => fingerPatternComplete(fingerId))
    : ALL_FINGERS.every((fingerId) => fingerProcessComplete(fingerId));

  const currentRidgesFilled = ridgeCountsFilled(currentFingerEntry());
  const fingerIndex = (fingerId: string) =>
    ALL_FINGERS.indexOf(fingerId as (typeof ALL_FINGERS)[number]);

  const nextFinger = ALL_FINGERS[fingerIndex(finger) + 1];

  const canGoNext =
    Boolean(mainPattern && subPattern) &&
    (!showRidgeFields || currentRidgesFilled) &&
    Boolean(nextFinger);

  const selectFinger = (nextFinger: string) => {
    const updated: Record<string, FingerEntry> = {
      ...fingerEntries,
      [finger]: currentFingerEntry(),
    };
    setFingerEntries(updated);
    setFinger(nextFinger);
    const saved = updated[nextFinger];
    setMainPattern(saved?.main ? normalizeMainPattern(saved.main) : '');
    setSubPattern(saved?.sub ?? '');
    setUrc(saved?.urc ?? '');
    setRrc(saved?.rrc ?? '');
    setLfo(saved?.lfo ?? '');
  };

  const handleNextFinger = () => {
    if (!canGoNext) return;
    const idx = fingerIndex(finger);
    if (idx < 0 || idx >= ALL_FINGERS.length - 1) return;
    selectFinger(ALL_FINGERS[idx + 1]);
  };

  const withFlagCheck = (proceed: () => void) => {
    if (flaggedFingers.length > 0) setPendingConfirm({ kind: 'flag', proceed });
    else proceed();
  };

  const closeButton = (
    <button type="button" className="btn-pill-secondary" onClick={onClose}>
      Close
    </button>
  );

  const nextFingerButton = (
    <div className="process-scan-next-cell">
      <button
        type="button"
        className="btn-pill-primary process-scan-next-btn"
        disabled={!canGoNext}
        onClick={handleNextFinger}
      >
        {nextFinger ? `Next · ${nextFinger}` : 'Next'}
      </button>
    </div>
  );

  const buildPayload = (): ProcessScanPayload => {
    const entries = mergedFingerEntries();
    const fingers = ALL_FINGERS.map((fingerId) => fingerPayloadFromEntry(fingerId, entries[fingerId] ?? {
      main: '',
      sub: '',
      ...EMPTY_RIDGES,
    }));
    const primary = fingers[0];
    return {
      ...record,
      fingers,
      mainPattern: primary.mainPattern,
      subPattern: primary.subPattern,
      finger: primary.finger,
      urc: primary.urc,
      rrc: primary.rrc,
      lfo: primary.lfo,
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

            {isReview ? (
              <p className="process-scan-view-hint">
                Flagged fingers are highlighted · correct patterns or URC/RRC ({RIDGE_MIN}–{RIDGE_MAX}) if needed, then
                confirm · or send back to Process
              </p>
            ) : isPreprocess ? (
              <p className="process-scan-view-hint">
                Select each finger below · fill main/sub pattern · use Next to move through all 10 fingers
              </p>
            ) : (
              <p className="process-scan-view-hint">
                Patterns from preprocess are shown per finger — edit if needed · enter URC and RRC ({RIDGE_MIN}–
                {RIDGE_MAX}) for each finger
              </p>
            )}

            {showFlagBanner ? (
              <div
                className="process-scan-flag-banner"
                role="status"
                title={`Flagged fingers (RRC more than URC + 3): ${flaggedFingers.join(', ')}`}
              >
                <LuTriangleAlert size={16} aria-hidden="true" />
                <strong>Alert - DDS</strong>
              </div>
            ) : null}

            <div className="process-scan-pattern-block">
              <p className="process-scan-section-label">Main Pattern</p>
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
            </div>

            <div className="process-scan-pattern-block">
              <p className="process-scan-section-label">Sub Pattern</p>
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
            </div>

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
                {nextFingerButton}
              </div>
            ) : null}

            {showRidgeFields ? (
              <div className="process-scan-ridge-grid">
                <RidgeInput label="URC" ariaLabel="Ulnar Ridge Count" value={urc} onChange={setUrc} />
                <RidgeInput label="RRC" ariaLabel="Radial Ridge Count" value={rrc} onChange={setRrc} />
                {nextFingerButton}
              </div>
            ) : null}

                <div className="process-scan-qc">
                <p className="process-scan-section-label">
                  QC - Finger Prints · {finger}
                  <span className="process-scan-qc-progress">
                    {' '}
                    · {ALL_FINGERS.filter((id) => fingerFilled(id)).length}/10 done
                  </span>
                </p>
                <div
                  className="process-scan-qc-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={10}
                  aria-valuenow={ALL_FINGERS.filter((id) => fingerFilled(id)).length}
                  aria-label="Finger QC progress"
                >
                  <span
                    style={{
                      width: `${(ALL_FINGERS.filter((id) => fingerFilled(id)).length / 10) * 100}%`,
                    }}
                  />
                </div>
                <div className="process-scan-qc-row">
                  {LEFT_FINGERS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`process-scan-qc-btn process-scan-qc-left${finger === item ? ' is-active' : ''}${fingerFilled(item) ? ' is-filled' : ''}${fingerFlagged(item) ? ' is-flagged' : ''}`}
                      title={fingerFlagged(item) ? 'Flag X: RRC is more than URC + 3' : undefined}
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
                      className={`process-scan-qc-btn process-scan-qc-right${finger === item ? ' is-active' : ''}${fingerFilled(item) ? ' is-filled' : ''}${fingerFlagged(item) ? ' is-flagged' : ''}`}
                      title={fingerFlagged(item) ? 'Flag X: RRC is more than URC + 3' : undefined}
                      onClick={() => selectFinger(item)}
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
            showCornerValues={showCornerValues}
            urc={urc}
            rrc={rrc}
            images={images}
            imagesLoading={imagesLoading}
            imageIndex={imageIndex}
          />
        </div>

        <div className="modal-footer process-scan-footer">
          {mode === 'preprocess' ? closeButton : null}

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
                disabled={!allFingersComplete}
                onClick={() =>
                  withFlagCheck(() => {
                    onComplete?.(buildPayload());
                    onClose();
                  })
                }
              >
                Done
              </button>
              {closeButton}
            </>
          ) : null}

          {mode === 'review' ? (
            <>
              <button
                type="button"
                className="scans-action-btn scans-action-export"
                disabled={!allFingersComplete}
                title={allFingersComplete ? undefined : `Every finger needs a pattern and URC/RRC between ${RIDGE_MIN} and ${RIDGE_MAX}`}
                onClick={() =>
                  withFlagCheck(() => {
                    onConfirmFlag?.(buildPayload());
                    onClose();
                  })
                }
              >
                Move to Download
              </button>
              <button
                type="button"
                className="scans-action-btn scans-action-danger"
                onClick={() => {
                  setRejectReason('');
                  setPendingConfirm({ kind: 'reject' });
                }}
              >
                Reject
              </button>
              {closeButton}
            </>
          ) : null}
        </div>
      </div>

      {pendingConfirm ? (
        <div
          className="modal-overlay process-scan-confirm-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPendingConfirm(null);
          }}
        >
          <div
            className="modal-panel reports-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="process-scan-confirm-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="process-scan-confirm-title" className="modal-title">
                  {pendingConfirm.kind === 'reject' ? 'Reject this scan?' : 'Flag X numbers entered'}
                </h2>
                <p className="modal-subtitle">
                  Scan {record.scanId} · {record.name}
                </p>
              </div>
            </div>
            <div className="modal-body">
              {pendingConfirm.kind === 'reject' ? (
                <>
                  <p className="reports-delete-warning">
                    The scan leaves Process Scan completely and goes back to the uploader as “Rejected by H.O”. They
                    must fix it in Upload Scan, mark QC and export it again. Patterns and counts entered here are
                    discarded.
                  </p>
                  <label className="form-field process-scan-reject-reason">
                    <span className="form-label">Reason (sent to the uploader)</span>
                    <textarea
                      className="form-input"
                      rows={3}
                      maxLength={500}
                      placeholder="e.g. Prints are blurred, please rescan"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </label>
                </>
              ) : (
                <p className="reports-delete-warning">
                  RRC is more than URC + 3 on <strong>{flaggedFingers.join(', ')}</strong>.{' '}
                  {isReview
                    ? 'Moving to Download confirms Flag X: this client must have CAB support before counselling.'
                    : 'This scan will be marked Flag X and go to Review for H.O confirmation.'}{' '}
                  Check the numbers before continuing.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-pill-secondary" onClick={() => setPendingConfirm(null)}>
                Go back
              </button>
              {pendingConfirm.kind === 'reject' ? (
                <button
                  type="button"
                  className="btn-pill-primary reports-delete-confirm"
                  onClick={() => {
                    setPendingConfirm(null);
                    onRejectReview?.(buildPayload(), rejectReason.trim());
                    onClose();
                  }}
                >
                  Reject scan
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-pill-primary"
                  onClick={() => {
                    const { proceed } = pendingConfirm;
                    setPendingConfirm(null);
                    proceed();
                  }}
                >
                  {isReview ? 'Confirm Flag X' : 'Yes, numbers are correct'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
