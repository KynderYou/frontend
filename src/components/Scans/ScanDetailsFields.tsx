import { useEffect, useState } from 'react';
import type { ScanDetails } from './scanTypes';
import { REPORT_PACKAGES } from '../Reports/reportPackages';
import {
  BASE_REFERRED_BY,
  clientTypeOptions,
  genderOptions,
  hasClientMobileFromPhone,
  isValidAge,
  MAX_AGE,
  MIN_AGE,
  normalizeClientType,
  phoneRequiredFor,
  type HasClientMobile,
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
  /** Controlled Yes/No for client mobile; when omitted, derived from phone / local state. */
  hasClientMobile?: HasClientMobile;
  onHasClientMobileChange?: (next: HasClientMobile) => void;
  /** Trainee uploads are always referred by the trainee, so the field is hidden. */
  hideReferredBy?: boolean;
};

export function ScanDetailsFields({
  scanId,
  scanIdPlaceholder,
  value,
  onChange,
  traineeNames = [],
  disabled = false,
  className = 'form-grid',
  hasClientMobile: controlledHasMobile,
  onHasClientMobileChange,
  hideReferredBy = false,
}: ScanDetailsFieldsProps) {
  const baseOptions = BASE_REFERRED_BY as readonly string[];
  const traineeOptions = traineeNames.filter((name) => name && !baseOptions.includes(name));
  const otherCurrent =
    value.referredBy && !baseOptions.includes(value.referredBy) && !traineeOptions.includes(value.referredBy)
      ? value.referredBy
      : null;
  const [localHasMobile, setLocalHasMobile] = useState<HasClientMobile>(() => hasClientMobileFromPhone(value.phone));
  const hasClientMobile = controlledHasMobile ?? localHasMobile;
  const needsPhone = phoneRequiredFor(hasClientMobile);
  const ageInvalid = value.age.trim().length > 0 && !isValidAge(value.age);

  useEffect(() => {
    if (controlledHasMobile !== undefined) return;
    if (value.phone.trim().length > 0 && localHasMobile !== 'yes') {
      setLocalHasMobile('yes');
    }
  }, [value.phone, controlledHasMobile, localHasMobile]);

  const setHasMobile = (next: HasClientMobile) => {
    if (onHasClientMobileChange) onHasClientMobileChange(next);
    else setLocalHasMobile(next);
    if (next !== 'yes' && value.phone) {
      onChange({ ...value, phone: '' });
    }
  };

  const update = (key: keyof ScanDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const next = e.target.value;
    if (key === 'clientType') {
      onChange({ ...value, clientType: normalizeClientType(next) });
      return;
    }
    if (key === 'age') {
      onChange({ ...value, age: next.replace(/\D/g, '').slice(0, 3) });
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
        <span className="form-label">Name</span>
        <input
          className="form-input"
          type="text"
          placeholder="Client name"
          value={value.name}
          onChange={update('name')}
          disabled={disabled}
        />
      </label>

      <label className="form-field">
        <span className="form-label">Age</span>
        <input
          className="form-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={`${MIN_AGE}–${MAX_AGE}`}
          value={value.age}
          onChange={update('age')}
          disabled={disabled}
          aria-invalid={ageInvalid}
        />
        {ageInvalid ? (
          <span className="form-field-error">
            Age must be between {MIN_AGE} and {MAX_AGE}
          </span>
        ) : null}
      </label>

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
        <span className="form-label">Client mobile number?</span>
        <div className="form-select-wrap">
          <select
            className="form-input form-select"
            value={hasClientMobile}
            onChange={(e) => setHasMobile(e.target.value as HasClientMobile)}
            disabled={disabled}
            required
          >
            <option value="" disabled>
              Yes / No
            </option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <Chevron />
        </div>
      </label>

      {needsPhone ? (
        <label className="form-field">
          <span className="form-label">Mobile number</span>
          <input
            className="form-input"
            type="tel"
            placeholder="Client's mobile number"
            value={value.phone}
            onChange={update('phone')}
            disabled={disabled}
            required
          />
        </label>
      ) : null}

      {hideReferredBy ? null : (
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
              <optgroup label="My counselors">
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
      )}

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
