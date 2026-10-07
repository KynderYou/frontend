import type { ScanDetails } from './scanTypes';
import { REPORT_PACKAGES } from '../Reports/reportPackages';
import {
  BASE_REFERRED_BY,
  CLIENT_TYPE_INDIVIDUAL,
  clientTypeOptions,
  genderOptions,
  normalizeClientType,
  phoneRequiredFor,
} from './scanDetails';

function Chevron() {
  return (
    <svg className="form-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

type ScanDetailsFieldsProps = {
  scanId: string;
  scanIdPlaceholder?: string;
  value: ScanDetails;
  onChange: (next: ScanDetails) => void;
  /** Mentor trainee directory names for Referred by */
  traineeNames?: string[];
  disabled?: boolean;
  className?: string;
};

export function ScanDetailsFields({
  scanId,
  scanIdPlaceholder,
  value,
  onChange,
  traineeNames = [],
  disabled = false,
  className = 'form-grid',
}: ScanDetailsFieldsProps) {
  const baseOptions = BASE_REFERRED_BY as readonly string[];
  const traineeOptions = traineeNames.filter((name) => name && !baseOptions.includes(name));
  const otherCurrent =
    value.referredBy && !baseOptions.includes(value.referredBy) && !traineeOptions.includes(value.referredBy)
      ? value.referredBy
      : null;
  const needsPhone = phoneRequiredFor(value.clientType);

  const update = (key: keyof ScanDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const next = e.target.value;
    if (key === 'clientType') {
      const clientType = normalizeClientType(next);
      onChange({ ...value, clientType, phone: clientType === CLIENT_TYPE_INDIVIDUAL ? '' : value.phone });
      return;
    }
    onChange({ ...value, [key]: next });
  };

  return (
    <div className={className}>
      <label className="form-field">
        <span className="form-label">Scan Id</span>
        <input className="form-input" type="text" value={scanId} placeholder={scanIdPlaceholder} readOnly disabled />
      </label>

      <label className="form-field">
        <span className="form-label">Referred By</span>
        <div className="form-select-wrap">
          <select className="form-input form-select" value={value.referredBy} onChange={update('referredBy')} disabled={disabled}>
            {baseOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
            {traineeOptions.length > 0 ? (
              <optgroup label="My trainees">
                {traineeOptions.map((name) => (
                  <option key={`trainee-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {otherCurrent ? <option value={otherCurrent}>{otherCurrent}</option> : null}
          </select>
          <Chevron />
        </div>
      </label>

      <label className="form-field">
        <span className="form-label">Name</span>
        <input className="form-input" type="text" value={value.name} onChange={update('name')} disabled={disabled} />
      </label>

      <label className="form-field">
        <span className="form-label">Client Type</span>
        <div className="form-select-wrap">
          <select className="form-input form-select" value={value.clientType} onChange={update('clientType')} disabled={disabled}>
            {clientTypeOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </label>

      <label className="form-field">
        <span className="form-label">Age</span>
        <input
          className="form-input"
          type="number"
          min={1}
          max={120}
          value={value.age}
          onChange={update('age')}
          disabled={disabled}
        />
      </label>

      {needsPhone ? (
        <label className="form-field">
          <span className="form-label">Phno</span>
          <input className="form-input" type="tel" value={value.phone} onChange={update('phone')} disabled={disabled} required />
        </label>
      ) : null}

      <label className="form-field">
        <span className="form-label">Gender</span>
        <div className="form-select-wrap">
          <select className="form-input form-select" value={value.gender} onChange={update('gender')} disabled={disabled}>
            <option value="" disabled>
              Select gender
            </option>
            {genderOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </label>

      <label className="form-field">
        <span className="form-label">Report package</span>
        <div className="form-select-wrap">
          <select className="form-input form-select" value={value.mrp} onChange={update('mrp')} disabled={disabled}>
            <option value="" disabled>
              Choose package
            </option>
            {REPORT_PACKAGES.map((pkg) => (
              <option key={pkg.id} value={pkg.mrp}>
                {pkg.id} · {pkg.mrp} · {pkg.pages} pages
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </label>
    </div>
  );
}
