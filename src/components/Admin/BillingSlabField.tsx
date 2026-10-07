import { parseBillingDigits } from './adminProfileForm';

type Slab = '40' | '30' | 'below';

type BillingSlabFieldProps = {
  value: string;
  onChange: (digits: string) => void;
  label?: string;
};

export function BillingSlabField({ value, onChange, label = 'Billing %' }: BillingSlabFieldProps) {
  const slab: Slab = value === '40' || value === '30' ? value : 'below';

  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="form-select-wrap" style={{ flex: 1, minWidth: 0 }}>
          <select
            className="form-input form-select"
            value={slab}
            onChange={(e) => {
              const next = e.target.value as Slab;
              onChange(next === 'below' ? '' : next);
            }}
          >
            <option value="40">40%</option>
            <option value="30">30%</option>
            <option value="below">Less than 30%</option>
          </select>
        </div>
        {slab === 'below' ? (
          <input
            className="form-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="Billing percent below 30"
            style={{ width: 96, flexShrink: 0 }}
            value={value}
            onChange={(e) => {
              const digits = parseBillingDigits(e.target.value);
              onChange(digits && Number(digits) > 29 ? '29' : digits);
            }}
            placeholder="e.g. 25"
          />
        ) : null}
      </div>
    </label>
  );
}
