import { useEffect, useState } from 'react';
import type { StatusMaster, StatusMasterInput } from '../../api/types';
import { spacing } from '../../styles/theme';

type StatusMasterModalProps = {
  open: boolean;
  initial: StatusMaster | null;
  busy: boolean;
  onClose: () => void;
  onSave: (body: StatusMasterInput) => void;
};

const EMPTY: StatusMasterInput = {
  name: '',
  rank: 0,
  dds_adult: 'na',
  dds_basic: 'na',
  dds_plus: 'na',
  min_lys: 'na',
  max_billing: null,
  renewal: 'na',
  nat_billing: null,
  sort_order: 0,
  active: true,
};

function fromRow(row: StatusMaster | null): StatusMasterInput {
  if (!row) return { ...EMPTY };
  return {
    name: row.name,
    rank: row.rank,
    dds_adult: row.dds_adult as StatusMasterInput['dds_adult'],
    dds_basic: row.dds_basic as StatusMasterInput['dds_basic'],
    dds_plus: row.dds_plus as StatusMasterInput['dds_plus'],
    min_lys: row.min_lys as StatusMasterInput['min_lys'],
    max_billing: row.max_billing,
    renewal: row.renewal as StatusMasterInput['renewal'],
    nat_billing: row.nat_billing,
    sort_order: row.sort_order,
    active: row.active,
  };
}

export function StatusMasterModal({ open, initial, busy, onClose, onSave }: StatusMasterModalProps) {
  const [form, setForm] = useState<StatusMasterInput>(EMPTY);
  const [maxNa, setMaxNa] = useState(true);
  const [natNa, setNatNa] = useState(true);

  useEffect(() => {
    if (!open) return;
    const next = fromRow(initial);
    setForm(next);
    setMaxNa(next.max_billing == null);
    setNatNa(next.nat_billing == null);
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

  const update = <K extends keyof StatusMasterInput>(key: K, value: StatusMasterInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSave = form.name.trim().length > 0 && form.rank >= 0 && !busy;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="modal-panel status-master-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-master-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="status-master-title" className="modal-title">
              {initial ? `Edit ${initial.name}` : 'Add status'}
            </h2>
            <p className="modal-subtitle">Set the rank and competencies for this Status Master row.</p>
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
              max_billing: maxNa ? null : form.max_billing ?? 0,
              nat_billing: natNa ? null : form.nat_billing ?? 0,
            });
          }}
        >
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
            <label className="form-field">
              <span className="form-label">Status name</span>
              <input className="form-input" value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={40} required />
            </label>
            <label className="form-field">
              <span className="form-label">Rank (0 = highest)</span>
              <input
                className="form-input"
                type="number"
                min={0}
                max={99}
                value={form.rank}
                onChange={(e) => update('rank', Number(e.target.value) || 0)}
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
              <span className="form-label">DDS-Adult</span>
              <select className="form-input" value={form.dds_adult} onChange={(e) => update('dds_adult', e.target.value as StatusMasterInput['dds_adult'])}>
                <option value="na">N.A</option>
                <option value="must">Must</option>
                <option value="optional">Optional</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">DDS-Basic</span>
              <select className="form-input" value={form.dds_basic} onChange={(e) => update('dds_basic', e.target.value as StatusMasterInput['dds_basic'])}>
                <option value="na">N.A</option>
                <option value="must">Must</option>
                <option value="optional">Optional</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">DDS-Plus</span>
              <select className="form-input" value={form.dds_plus} onChange={(e) => update('dds_plus', e.target.value as StatusMasterInput['dds_plus'])}>
                <option value="na">N.A</option>
                <option value="must">Must</option>
                <option value="optional">Optional</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Min LYS</span>
              <select className="form-input" value={form.min_lys} onChange={(e) => update('min_lys', e.target.value as StatusMasterInput['min_lys'])}>
                <option value="na">N.A</option>
                <option value="upto_25">Upto 25</option>
                <option value="25_49">25-49</option>
                <option value="50_99">50-99</option>
                <option value="100_plus">100+</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Renewal</span>
              <select className="form-input" value={form.renewal} onChange={(e) => update('renewal', e.target.value as StatusMasterInput['renewal'])}>
                <option value="na">N.A</option>
                <option value="optional">Optional</option>
                <option value="must">Must</option>
              </select>
            </label>
            <div className="form-field">
              <span className="form-label">Max Billing</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="admin-form-checkbox" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={maxNa}
                    onChange={(e) => {
                      setMaxNa(e.target.checked);
                      if (e.target.checked) update('max_billing', null);
                      else update('max_billing', form.max_billing ?? 0);
                    }}
                  />
                  <span>N.A</span>
                </label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  max={100}
                  disabled={maxNa}
                  value={form.max_billing ?? 0}
                  onChange={(e) => update('max_billing', Number(e.target.value) || 0)}
                  style={{ flex: 1 }}
                />
                <span>%</span>
              </div>
            </div>
            <div className="form-field">
              <span className="form-label">NAT Billing</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="admin-form-checkbox" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={natNa}
                    onChange={(e) => {
                      setNatNa(e.target.checked);
                      if (e.target.checked) update('nat_billing', null);
                      else update('nat_billing', form.nat_billing ?? 0);
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
                  value={form.nat_billing ?? 0}
                  onChange={(e) => update('nat_billing', Number(e.target.value) || 0)}
                  style={{ flex: 1 }}
                />
                <span>%</span>
              </div>
            </div>
            <label className="form-field admin-form-checkbox">
              <input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} />
              <span className="form-label" style={{ margin: 0 }}>
                Active
              </span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-pill-primary" disabled={!canSave}>
              {busy ? 'Saving…' : initial ? 'Save changes' : 'Add status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
