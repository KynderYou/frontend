import { useEffect, useState } from 'react';
import type { RightsMaster, RightsMasterInput } from '../../api/types';
import { spacing } from '../../styles/theme';

type RightsMasterModalProps = {
  open: boolean;
  initial: RightsMaster | null;
  busy: boolean;
  onClose: () => void;
  onSave: (body: RightsMasterInput) => void;
};

const EMPTY: RightsMasterInput = {
  name: '',
  subscription_amount: 0,
  billing_percent: 0,
  cws_reports: 'na',
  mrp_display: 'must',
  lys_billing: 'na',
  plus_reports: 'upgrade',
  dnai_reports: 'na',
  nat_discount: null,
  sort_order: 0,
  active: true,
};

function fromRow(row: RightsMaster | null): RightsMasterInput {
  if (!row) return { ...EMPTY };
  return {
    name: row.name,
    subscription_amount: row.subscription_amount,
    billing_percent: row.billing_percent,
    cws_reports: row.cws_reports as RightsMasterInput['cws_reports'],
    mrp_display: row.mrp_display as RightsMasterInput['mrp_display'],
    lys_billing: row.lys_billing as RightsMasterInput['lys_billing'],
    plus_reports: row.plus_reports as RightsMasterInput['plus_reports'],
    dnai_reports: row.dnai_reports as RightsMasterInput['dnai_reports'],
    nat_discount: row.nat_discount,
    sort_order: row.sort_order,
    active: row.active,
  };
}

export function RightsMasterModal({ open, initial, busy, onClose, onSave }: RightsMasterModalProps) {
  const [form, setForm] = useState<RightsMasterInput>(EMPTY);
  const [natNa, setNatNa] = useState(true);

  useEffect(() => {
    if (!open) return;
    const next = fromRow(initial);
    setForm(next);
    setNatNa(next.nat_discount == null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, initial, onClose, busy]);

  if (!open) return null;

  const update = <K extends keyof RightsMasterInput>(key: K, value: RightsMasterInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSave = form.name.trim().length > 0 && form.subscription_amount >= 0 && !busy;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="modal-panel rights-master-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rights-master-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="rights-master-title" className="modal-title">
              {initial ? `Edit ${initial.name}` : 'Add subscription tier'}
            </h2>
            <p className="modal-subtitle">Set the fee and privileges for this Rights Master row.</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSave) return;
            onSave({
              ...form,
              name: form.name.trim(),
              nat_discount: natNa ? null : form.nat_discount ?? 0,
            });
          }}
        >
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
            <label className="form-field">
              <span className="form-label">Tier name</span>
              <input className="form-input" value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={40} required />
            </label>
            <label className="form-field">
              <span className="form-label">Subscription (₹)</span>
              <input
                className="form-input"
                type="number"
                min={0}
                step={100}
                value={form.subscription_amount}
                onChange={(e) => update('subscription_amount', Number(e.target.value) || 0)}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Billing %</span>
              <input
                className="form-input"
                type="number"
                min={0}
                max={100}
                value={form.billing_percent}
                onChange={(e) => update('billing_percent', Number(e.target.value) || 0)}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Sort order</span>
              <input
                className="form-input"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => update('sort_order', Number(e.target.value) || 0)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">CWS Reports</span>
              <select className="form-input" value={form.cws_reports} onChange={(e) => update('cws_reports', e.target.value as RightsMasterInput['cws_reports'])}>
                <option value="na">N.A</option>
                <option value="yes">Yes</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">MRP Display</span>
              <select className="form-input" value={form.mrp_display} onChange={(e) => update('mrp_display', e.target.value as RightsMasterInput['mrp_display'])}>
                <option value="must">Must</option>
                <option value="optional">Optional</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">LYS Billing</span>
              <select className="form-input" value={form.lys_billing} onChange={(e) => update('lys_billing', e.target.value as RightsMasterInput['lys_billing'])}>
                <option value="na">N.A</option>
                <option value="yes">Yes</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Plus Reports</span>
              <select className="form-input" value={form.plus_reports} onChange={(e) => update('plus_reports', e.target.value as RightsMasterInput['plus_reports'])}>
                <option value="upgrade">Upgrade</option>
                <option value="direct">Direct</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">DNAi Reports</span>
              <select className="form-input" value={form.dnai_reports} onChange={(e) => update('dnai_reports', e.target.value as RightsMasterInput['dnai_reports'])}>
                <option value="na">N.A</option>
                <option value="conditional">Conditional</option>
                <option value="yes">Yes</option>
              </select>
            </label>
            <div className="form-field">
              <span className="form-label">NAT Discount</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="admin-form-checkbox" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={natNa}
                    onChange={(e) => {
                      setNatNa(e.target.checked);
                      if (e.target.checked) update('nat_discount', null);
                      else update('nat_discount', form.nat_discount ?? 0);
                    }}
                  />
                  <span>N.A</span>
                </label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  max={100}
                  disabled={natNa}
                  value={form.nat_discount ?? 0}
                  onChange={(e) => update('nat_discount', Number(e.target.value) || 0)}
                  style={{ flex: 1 }}
                />
                <span>%</span>
              </div>
            </div>
            <label className="form-field admin-form-checkbox">
              <input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} />
              <span className="form-label" style={{ margin: 0 }}>
                Active (shown in member subscription lists)
              </span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-pill-primary" disabled={!canSave}>
              {busy ? 'Saving…' : initial ? 'Save changes' : 'Add tier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
