import { useEffect, useMemo, useRef, useState } from 'react';
import { initials } from '../../utils/initials';

export type LedgerPerson = { id: number; name: string; role: string };

type RoleTab = 'All' | 'Admins' | 'Mentors' | 'MLAs';

const TAB_ROLES: Record<Exclude<RoleTab, 'All'>, string[]> = {
  Admins: ['Super Admin', 'Admin'],
  Mentors: ['Mentor'],
  MLAs: ['MLA'],
};

function roleTone(role: string): string {
  if (role === 'Super Admin' || role === 'Admin') return 'admin';
  if (role === 'Mentor') return 'mentor';
  return 'mla';
}

type LedgerPeopleFilterProps = {
  people: LedgerPerson[];
  value: string;
  onChange: (value: string) => void;
  superAdmin: boolean;
};

export function LedgerPeopleFilter({ people, value, onChange, superAdmin }: LedgerPeopleFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<RoleTab>('All');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const ownLabel = superAdmin ? 'All admins' : 'My ledger';
  const ownHint = superAdmin ? 'Every admin ledger combined' : 'Your own receipts and billing';
  const selected = people.find((person) => String(person.id) === value) ?? null;

  const tabs = useMemo(
    () =>
      (Object.keys(TAB_ROLES) as Exclude<RoleTab, 'All'>[])
        .map((name) => ({ name, count: people.filter((person) => TAB_ROLES[name].includes(person.role)).length }))
        .filter((entry) => entry.count > 0),
    [people],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((person) => {
      if (tab !== 'All' && !TAB_ROLES[tab].includes(person.role)) return false;
      return !q || person.name.toLowerCase().includes(q);
    });
  }, [people, query, tab]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="people-filter" ref={rootRef}>
      <button
        type="button"
        className={`people-filter-trigger${selected ? ' is-filtered' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {selected ? (
          <span className={`people-filter-avatar tone-${roleTone(selected.role)}`} aria-hidden="true">
            {initials(selected.name)}
          </span>
        ) : (
          <span className="people-filter-avatar tone-self" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
              <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" />
            </svg>
          </span>
        )}
        <span className="people-filter-text">
          <span className="people-filter-caption">Viewing</span>
          <span className="people-filter-name">{selected ? selected.name : ownLabel}</span>
        </span>
        {selected ? <span className={`people-filter-role tone-${roleTone(selected.role)}`}>{selected.role}</span> : null}
        <svg className="people-filter-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {selected ? (
        <button type="button" className="people-filter-clear" aria-label={`Back to ${ownLabel}`} title={`Back to ${ownLabel}`} onClick={() => choose('')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      ) : null}

      {open ? (
        <div className="people-filter-panel" role="dialog" aria-label="Choose whose ledger to view">
          <label className="people-filter-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people" aria-label="Search people" />
          </label>

          {tabs.length > 1 ? (
            <div className="people-filter-tabs" role="tablist" aria-label="Filter by role">
              {[{ name: 'All' as RoleTab, count: people.length }, ...tabs].map((entry) => (
                <button
                  key={entry.name}
                  type="button"
                  role="tab"
                  aria-selected={tab === entry.name}
                  className={`people-filter-tab${tab === entry.name ? ' is-active' : ''}`}
                  onClick={() => setTab(entry.name)}
                >
                  {entry.name}
                  <span className="people-filter-tab-count">{entry.count}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="people-filter-list" role="listbox" aria-label="People">
            {!query && tab === 'All' ? (
              <button type="button" role="option" aria-selected={!selected} className={`people-filter-option${!selected ? ' is-selected' : ''}`} onClick={() => choose('')}>
                <span className="people-filter-avatar tone-self" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="8" r="3.5" />
                    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
                    <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" />
                  </svg>
                </span>
                <span className="people-filter-option-text">
                  <span className="people-filter-option-name">{ownLabel}</span>
                  <span className="people-filter-option-hint">{ownHint}</span>
                </span>
                {!selected ? <CheckIcon /> : null}
              </button>
            ) : null}

            {visible.length === 0 ? (
              <p className="people-filter-empty">No one matches “{query}”.</p>
            ) : (
              visible.map((person) => {
                const isSelected = String(person.id) === value;
                const tone = roleTone(person.role);
                return (
                  <button
                    key={person.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`people-filter-option${isSelected ? ' is-selected' : ''}`}
                    onClick={() => choose(String(person.id))}
                  >
                    <span className={`people-filter-avatar tone-${tone}`} aria-hidden="true">
                      {initials(person.name)}
                    </span>
                    <span className="people-filter-option-text">
                      <span className="people-filter-option-name">{person.name}</span>
                    </span>
                    <span className={`people-filter-role tone-${tone}`}>{person.role}</span>
                    {isSelected ? <CheckIcon /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="people-filter-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}
