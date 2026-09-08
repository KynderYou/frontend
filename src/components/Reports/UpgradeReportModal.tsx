import { useEffect, useMemo, useState } from 'react';
import type { ReportRecord } from './reportTypes';
import {
  formatInr,
  higherPackages,
  packageForPlan,
  upgradeDelta,
  type ReportPlan,
} from './reportPackages';

type UpgradeReportModalProps = {
  open: boolean;
  record: ReportRecord | null;
  onClose: () => void;
  onConfirm: (record: ReportRecord, targetPlan: ReportPlan) => void;
};

export function UpgradeReportModal({ open, record, onClose, onConfirm }: UpgradeReportModalProps) {
  const options = useMemo(() => (record ? higherPackages(record.plan) : []), [record]);
  const [targetPlan, setTargetPlan] = useState<ReportPlan | null>(null);

  useEffect(() => {
    if (!open) return;
    setTargetPlan(options[0]?.id ?? null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, options]);

  if (!open || !record) return null;

  const current = packageForPlan(record.plan);
  const selected = targetPlan ? packageForPlan(targetPlan) : null;
  const delta = targetPlan ? upgradeDelta(record.plan, targetPlan) : 0;
  const canConfirm = Boolean(targetPlan && selected && delta > 0);

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel reports-upgrade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-report-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="upgrade-report-title" className="modal-title">
              Upgrade report package
            </h2>
            <p className="modal-subtitle">
              Scan {record.scanId} · {record.details.name || 'Client'} — currently {current.id} (
              {current.pages} pages · {current.mrp}).
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {options.length === 0 ? (
            <p className="modal-subtitle" style={{ margin: 0 }}>
              This scan is already on the highest package (GBPB Plus).
            </p>
          ) : (
            <>
              <div className="reports-upgrade-options" role="radiogroup" aria-label="Choose package">
                {options.map((pkg) => {
                  const pkgDelta = upgradeDelta(record.plan, pkg.id);
                  const checked = targetPlan === pkg.id;
                  return (
                    <label key={pkg.id} className={`reports-upgrade-option${checked ? ' is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="upgrade-plan"
                        value={pkg.id}
                        checked={checked}
                        onChange={() => setTargetPlan(pkg.id)}
                      />
                      <span className="reports-upgrade-option-copy">
                        <span className="reports-upgrade-option-title">{pkg.id}</span>
                        <span className="reports-upgrade-option-meta">
                          {pkg.pages} pages · {pkg.mrp}
                        </span>
                      </span>
                      <span className="reports-upgrade-option-delta">+{formatInr(pkgDelta)}</span>
                    </label>
                  );
                })}
              </div>
              {selected ? (
                <div className="reports-upgrade-price">
                  <span className="reports-upgrade-price-value">{formatInr(delta)}</span>
                  <span className="reports-upgrade-price-meta">
                    upgrade difference · {selected.pages}-page {selected.id}
                  </span>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose}>
            Not now
          </button>
          <button
            type="button"
            className="btn-pill-primary"
            disabled={!canConfirm}
            onClick={() => {
              if (!targetPlan || !canConfirm) return;
              onConfirm(record, targetPlan);
              onClose();
            }}
          >
            Upgrade to {selected?.id ?? 'package'}
          </button>
        </div>
      </div>
    </div>
  );
}
