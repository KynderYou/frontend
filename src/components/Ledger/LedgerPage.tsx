import { useEffect, useMemo, useState } from 'react';
import { addCompanyEntry, addCompanyFunds, ApiError, getMyLedger, submitLedgerTopUp } from '../../api';
import type { LedgerEntryRow } from '../../api';
import type { CompanyLedgerEntryApi } from '../../api/types';
import { colors, metricColors, radius, spacing, typography, type MetricColor } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { TopUpModal } from './TopUpModal';
import { AddCompanyEntryModal } from './AddCompanyEntryModal';
import { AddFundsModal } from './AddFundsModal';
import { LedgerPeriodFilter } from './LedgerPeriodFilter';
import { LedgerPeopleFilter } from './LedgerPeopleFilter';
import {
  inLedgerRange,
  ledgerDisplayDateToIso,
  ledgerRange,
  ledgerRangeLabel,
  type LedgerPeriod,
  type LedgerRange,
} from './ledgerPeriod';
import { SkeletonLedgerBody, SkeletonSubtitle } from '../common/Skeleton';
import { useCurrentMember } from '../Auth/MemberContext';
import { isAdminRole } from '../../utils/roles';

const theme = colors.light;
const LEDGER_TX_PAGE_SIZE = 10;
const COMPANY_LEDGER_PAGE_SIZE = 10;
const COMPANY_PERIODS: LedgerPeriod[] = ['all', '7d', '30d', 'custom'];

type LedgerTab = 'receipts' | 'billing';

type KpiDef = {
  id: LedgerTab;
  label: string;
  getHint: (rangeLabel: string, companyWide: boolean) => string;
  color: MetricColor;
  icon: React.ReactNode;
};

const kpis: KpiDef[] = [
  {
    id: 'receipts',
    label: 'Total Receipts',
    getHint: (rangeLabel, companyWide) =>
      `${rangeLabel} · ${companyWide ? 'report billing, funds & receipts' : 'top-ups & CAB credits'}`,
    color: 'green',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    ),
  },
  {
    id: 'billing',
    label: 'Total Billing',
    getHint: (rangeLabel, companyWide) =>
      `${rangeLabel} · ${companyWide ? 'member top-ups, CAB payouts & expenses' : 'report billing'}`,
    color: 'purple',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M3 10h18" />
        <circle cx="16" cy="14.5" r="1.6" />
      </svg>
    ),
  },
];

const TAB_TITLES: Record<LedgerTab, string> = { receipts: 'Receipts', billing: 'Billing' };

type LedgerPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

type CompanySector = {
  label: string;
  tone: string;
  icon: React.ReactNode;
  fallbackDetail?: string;
  /** Debits shown in green: report billing is the expected charge for a finished report. */
  greenDebit?: boolean;
};

const SECTOR_ICON_PROPS = {
  width: 15,
  height: 15,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const COMPANY_SECTORS: Record<string, CompanySector> = {
  report_billing: {
    label: 'Report billing',
    tone: 'blue',
    icon: (
      <svg {...SECTOR_ICON_PROPS}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    ),
  },
  cab_payout: {
    label: 'CAB feedback',
    tone: 'pink',
    icon: (
      <svg {...SECTOR_ICON_PROPS}>
        <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
        <path d="M21 19a2 2 0 0 1-2 2h-1v-7h3zM3 19a2 2 0 0 0 2 2h1v-7H3z" />
      </svg>
    ),
  },
  topup: {
    label: 'Member top-up',
    tone: 'teal',
    icon: (
      <svg {...SECTOR_ICON_PROPS}>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    ),
  },
  funds: {
    label: 'Funds added',
    tone: 'green',
    fallbackDetail: 'Added to the company ledger',
    icon: (
      <svg {...SECTOR_ICON_PROPS}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  opening: {
    label: 'Opening balance',
    tone: 'green',
    fallbackDetail: 'Starting company balance',
    icon: (
      <svg {...SECTOR_ICON_PROPS}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M16 15h2" />
      </svg>
    ),
  },
  manual_receipt: {
    label: 'Receipt',
    tone: 'violet',
    icon: (
      <svg {...SECTOR_ICON_PROPS}>
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
      </svg>
    ),
  },
  manual_expense: {
    label: 'Expense',
    tone: 'amber',
    icon: (
      <svg {...SECTOR_ICON_PROPS}>
        <path d="M12 21V9M7 14l5-5 5 5M5 3h14" />
      </svg>
    ),
  },
};

const SECTORS: Record<string, CompanySector> = {
  ...COMPANY_SECTORS,
  report_debit: { ...COMPANY_SECTORS.report_billing, tone: 'green', greenDebit: true },
  cab_credit: COMPANY_SECTORS.cab_payout,
  receipt: COMPANY_SECTORS.manual_receipt,
  billing: { ...COMPANY_SECTORS.manual_expense, label: 'Billing' },
  debit: { ...COMPANY_SECTORS.manual_expense, label: 'Billing' },
};

const SECTOR_TITLE_PREFIXES = ['Report billing · ', 'CAB credit · ', 'Top-up credit · '];

const FALLBACK_SECTOR: CompanySector = { label: 'Other', tone: 'slate', icon: COMPANY_SECTORS.funds.icon };

type SectorRowProps = {
  kind: string;
  title: string;
  amount: string;
  isCredit: boolean;
  createdBy?: string | null;
  owner?: string | null;
};

function SectorRow({ kind, title, amount, isCredit, createdBy, owner }: SectorRowProps) {
  const sector = SECTORS[kind] ?? FALLBACK_SECTOR;
  const prefix = SECTOR_TITLE_PREFIXES.find((p) => title.startsWith(p));
  const stripped = prefix ? title.slice(prefix.length) : title;
  const detail = stripped && stripped !== sector.label ? stripped : sector.fallbackDetail ?? stripped;
  const description = [detail, createdBy, owner ? `${owner}'s ledger` : null].filter(Boolean).join(' · ');
  return (
    <div className={`ledger-company-row tone-${sector.tone}`}>
      <span className="ledger-company-icon">{sector.icon}</span>
      <div className="ledger-company-text">
        <span className="ledger-company-sector">{sector.label}</span>
        <span className="ledger-company-desc" title={description}>
          {description}
        </span>
      </div>
      <span className={`ledger-company-amount ${isCredit || sector.greenDebit ? 'is-credit' : 'is-debit'}`}>
        {isCredit ? '+' : '−'}
        {amount}
      </span>
    </div>
  );
}

function CompanyEntryRow({ entry, showOwner }: { entry: CompanyLedgerEntryApi; showOwner: boolean }) {
  return (
    <SectorRow
      kind={entry.kind}
      title={entry.title}
      amount={entry.amount}
      isCredit={entry.is_credit}
      createdBy={entry.created_by}
      owner={showOwner ? entry.admin : null}
    />
  );
}

function TransactionRow({ tx, isCredit }: { tx: LedgerEntryRow; isCredit: boolean }) {
  return <SectorRow kind={tx.kind ?? ''} title={tx.title} amount={tx.amount} isCredit={tx.is_credit ?? isCredit} />;
}

function emptyHint(tab: LedgerTab, companyWide: boolean): string {
  if (tab === 'receipts') return companyWide ? 'Report billing, funds and receipts appear here.' : 'Top-ups and CAB credits appear here.';
  return companyWide ? 'Member top-ups, CAB payouts and expenses appear here.' : 'Report billing appears here.';
}


type LedgerSectionProps = {
  tab: LedgerTab;
  entries: LedgerEntryRow[];
  resetKey: string;
  periodLabel: string;
  emptyDescription: string;
  onAdd?: () => void;
};

function LedgerSection({ tab, entries, resetKey, periodLabel, emptyDescription, onAdd }: LedgerSectionProps) {
  const pagination = useClientPagination(entries, LEDGER_TX_PAGE_SIZE, `${tab}|${resetKey}`);
  const title = TAB_TITLES[tab];
  const addLabel = tab === 'receipts' ? 'Add receipt' : 'Add expense';
  return (
    <div className="dash-card ledger-section-card" style={{ padding: spacing[5] }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4], flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: theme['text-primary'] }}>{title}</h2>
          {onAdd ? (
            <button type="button" className="ledger-add-entry-btn" aria-label={addLabel} title={addLabel} onClick={onAdd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          ) : null}
        </div>
        <span style={{ color: theme['text-secondary'], fontSize: 14, fontWeight: 500, padding: '4px 2px' }}>{periodLabel}</span>
      </div>
      <div className="ledger-section-list">
        {entries.length === 0 ? (
          <EmptyState compact title={`No ${title.toLowerCase()} in this period`} description={emptyDescription} />
        ) : (
          groupByDate(pagination.pageItems).map((group) => (
            <div key={group.date} className="ledger-company-group">
              <div className="ledger-company-date">{group.date}</div>
              {group.entries.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} isCredit={tab !== 'billing'} />
              ))}
            </div>
          ))
        )}
      </div>
      <TablePager
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setPage}
        className="mis-table-footer"
      />
    </div>
  );
}

function groupByDate<T extends { date: string }>(entries: T[]): { date: string; entries: T[] }[] {
  const groups: { date: string; entries: T[] }[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) last.entries.push(entry);
    else groups.push({ date: entry.date, entries: [entry] });
  }
  return groups;
}

export function LedgerPage({ onOpenMobileMenu, onOpenProfile }: LedgerPageProps) {
  const { showSuccess, showError } = useToast();
  const member = useCurrentMember();
  const isMla = member?.role === 'Trainee' || member?.role === 'MLA';
  // Mentors pay for their own uploads too, so they top up the same way as MLAs.
  const canTopUp = isMla || member?.role === 'Mentor';
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [topUpError, setTopUpError] = useState('');
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof getMyLedger>> | null>(null);
  const [fundsOpen, setFundsOpen] = useState(false);
  const [fundsSubmitting, setFundsSubmitting] = useState(false);
  const [fundsError, setFundsError] = useState('');
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryKind, setEntryKind] = useState<'receipt' | 'expense'>('receipt');
  const [companyKind, setCompanyKind] = useState('all');
  const [companyPeriod, setCompanyPeriod] = useState<LedgerPeriod>('all');
  const [companyCustom, setCompanyCustom] = useState<LedgerRange>({});
  const [entrySubmitting, setEntrySubmitting] = useState(false);
  const [entryError, setEntryError] = useState('');
  const [period, setPeriod] = useState<LedgerPeriod>('all');
  const [customRange, setCustomRange] = useState<LedgerRange>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [personFilter, setPersonFilter] = useState('');
  const memberId = personFilter ? Number(personFilter) : undefined;
  const range = useMemo(() => ledgerRange(period, customRange), [period, customRange]);
  const rangeLabel = ledgerRangeLabel(period, range);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyLedger(undefined, { ...range, memberId })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoadError('');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const detail = err instanceof ApiError ? (err.body as { detail?: unknown } | null)?.detail : null;
        setLoadError(typeof detail === 'string' ? detail : 'Unable to load ledger.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, memberId, reloadKey]);

  const companyWide = data?.company_wide ?? false;
  const superAdmin = data?.super_admin ?? false;
  const people = data?.people ?? [];
  const viewingName = data?.viewing_member_id ? data.viewing_name ?? 'Member' : null;
  const combinedView = superAdmin && companyWide && !viewingName;
  /** Funds and manual entries a Super Admin adds while viewing an admin go to that admin's ledger. */
  const adminId = companyWide && data?.viewing_member_id ? data.viewing_member_id : undefined;
  const entriesByTab: Record<LedgerTab, LedgerEntryRow[]> = {
    receipts: data?.receipts ?? [],
    billing: data?.billing ?? [],
  };
  const totalsByTab: Record<LedgerTab, number> = {
    receipts: data?.kpis.total_receipts ?? 0,
    billing: data?.kpis.billing_last_30_days ?? 0,
  };
  const displayByTab: Record<LedgerTab, string> = {
    receipts: data?.kpis.receipts_display ?? '₹0',
    billing: data?.kpis.billing_display ?? '₹0',
  };
  const visibleKpis = kpis;
  const companyEntries = useMemo(() => data?.company_entries ?? [], [data]);
  const companyKinds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of companyEntries) counts.set(entry.kind, (counts.get(entry.kind) ?? 0) + 1);
    return [...counts.entries()].map(([kind, count]) => ({ kind, count, label: COMPANY_SECTORS[kind]?.label ?? kind }));
  }, [companyEntries]);
  const companyRange = useMemo(() => ledgerRange(companyPeriod, companyCustom), [companyPeriod, companyCustom]);
  const filteredCompanyEntries = useMemo(
    () =>
      companyEntries.filter(
        (entry) =>
          (companyKind === 'all' || entry.kind === companyKind) &&
          inLedgerRange(ledgerDisplayDateToIso(entry.date), companyRange),
      ),
    [companyEntries, companyKind, companyRange],
  );
  const companyFiltered = companyKind !== 'all' || companyPeriod !== 'all';
  const companyPagination = useClientPagination(
    filteredCompanyEntries,
    COMPANY_LEDGER_PAGE_SIZE,
    `company|${companyKind}|${companyRange.start ?? ''}|${companyRange.end ?? ''}`,
  );

  const periodLabel = companyWide ? `${rangeLabel} · all members` : rangeLabel;
  const initialLoading = loading && data === null;

  const handleTopUp = async (amount: string, proof: File) => {
    setTopUpSubmitting(true);
    setTopUpError('');
    try {
      await submitLedgerTopUp(amount, proof);
      setReloadKey((key) => key + 1);
      setTopUpOpen(false);
      const formatted = amount.trim().replace(/^₹\s*/, '');
      showSuccess(
        `₹${formatted} credited to your ledger. Admin may verify the payment proof later.`,
      );
    } catch {
      const message = 'Could not submit top up. Check amount and proof, then try again.';
      setTopUpError(message);
      showError(message);
    } finally {
      setTopUpSubmitting(false);
    }
  };

  const handleAddFunds = async (amount: string) => {
    setFundsSubmitting(true);
    setFundsError('');
    try {
      const ledger = await addCompanyFunds(amount, adminId);
      setReloadKey((key) => key + 1);
      setFundsOpen(false);
      showSuccess(`Funds added · company balance ${ledger.available_balance_display ?? ''}`.trim());
    } catch (err) {
      const detail = err instanceof ApiError ? (err.body as { detail?: unknown } | null)?.detail : null;
      const message = typeof detail === 'string' ? detail : 'Could not add funds. Please try again.';
      setFundsError(message);
      showError(message);
    } finally {
      setFundsSubmitting(false);
    }
  };

  const openEntryModal = (kind: 'receipt' | 'expense') => {
    setEntryKind(kind);
    setEntryError('');
    setEntryOpen(true);
  };

  const handleAddEntry = async (title: string, amount: string) => {
    setEntrySubmitting(true);
    setEntryError('');
    try {
      await addCompanyEntry(entryKind, title, amount, adminId);
      setReloadKey((key) => key + 1);
      setEntryOpen(false);
      showSuccess(entryKind === 'receipt' ? 'Receipt added' : 'Expense added');
    } catch (err) {
      const detail = err instanceof ApiError ? (err.body as { detail?: unknown } | null)?.detail : null;
      const message = typeof detail === 'string' ? detail : 'Could not save the entry. Please try again.';
      setEntryError(message);
      showError(message);
    } finally {
      setEntrySubmitting(false);
    }
  };

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1
            className="page-title"
            style={{
              margin: 0,
              fontSize: typography.roles.pageTitle.fontSize,
              lineHeight: typography.roles.pageTitle.lineHeight,
              fontWeight: typography.roles.pageTitle.fontWeight,
              letterSpacing: typography.roles.pageTitle.letterSpacing,
              color: theme['text-primary'],
            }}
          >
            {isAdminRole(member?.role) ? 'Ledger' : 'My Ledger'}
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 16, color: theme['text-secondary'] }}>
            {initialLoading ? (
              <SkeletonSubtitle />
            ) : viewingName ? (
              `Viewing ${viewingName}'s ledger${data?.viewing_role ? ` · ${data.viewing_role}` : ''}.`
            ) : combinedView ? (
              'Every admin ledger combined · receipts and billing across all members.'
            ) : companyWide ? (
              'Report billing is your receipt · member top-ups and CAB payouts are your billing.'
            ) : (
              'Every credit is a receipt and every debit is billing.'
            )}
          </p>
        </div>

        <div className="page-header-actions">
          <button type="button" className="btn-icon mobile-menu-btn" aria-label="Open menu" onClick={onOpenMobileMenu}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <NotificationButton />
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </div>

      {loadError ? (
        <p role="alert" style={{ marginBottom: spacing[4], color: theme.error, fontSize: 14 }}>
          {loadError}
        </p>
      ) : null}

      {!initialLoading && !companyWide ? (
        <div className="dash-card ledger-topup-banner ledger-company-banner">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme['text-secondary'] }}>
              {viewingName ? `${viewingName}'s balance` : 'Your balance'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme['text-primary'], letterSpacing: '-0.02em', marginTop: 4 }}>
              {data?.available_balance_display ?? '₹0'}
            </div>
            <div style={{ fontSize: 14, color: theme['text-muted'], marginTop: 2 }}>
              Receipts minus billing{canTopUp && !viewingName ? ' · top up with a payment proof to add funds.' : '.'}
            </div>
          </div>
          {canTopUp && !viewingName ? (
            <button
              type="button"
              className="btn-pill-primary"
              onClick={() => {
                setTopUpError('');
                setTopUpOpen(true);
              }}
              style={{ height: 44, padding: '0 20px', flexShrink: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Top up now
            </button>
          ) : null}
        </div>
      ) : null}

      {!initialLoading && companyWide ? (
        <div className="dash-card ledger-topup-banner ledger-company-banner">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme['text-secondary'] }}>
              {combinedView ? 'Combined balance · all admins' : viewingName ? `${viewingName}'s ledger balance` : 'Ledger balance'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme['text-primary'], letterSpacing: '-0.02em', marginTop: 4 }}>
              {data?.available_balance_display ?? '₹0'}
            </div>
            <div style={{ fontSize: 14, color: theme['text-muted'], marginTop: 2 }}>
              {combinedView
                ? 'Total of every admin ledger.'
                : 'Report billing adds to this balance · member top-ups, CAB payouts and expenses come out of it.'}
            </div>
          </div>
          {superAdmin ? null : (
            <button
              type="button"
              className="btn-pill-primary"
              onClick={() => {
                setFundsError('');
                setFundsOpen(true);
              }}
              style={{ height: 44, padding: '0 20px', flexShrink: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Add funds
            </button>
          )}
        </div>
      ) : null}

      {initialLoading ? (
        <SkeletonLedgerBody />
      ) : (
        <>
          <div className="dash-card ledger-filter-bar">
            <span className="ledger-filter-status">
              {rangeLabel.toLowerCase().startsWith('all') ? 'All transactions' : rangeLabel}
              {loading ? <span className="ledger-filter-updating"> · updating…</span> : null}
            </span>
            <div className="ledger-filter-controls">
              {people.length > 0 ? (
                <LedgerPeopleFilter people={people} value={personFilter} onChange={setPersonFilter} superAdmin={superAdmin} />
              ) : null}
              <div className="ledger-filter-period">
                <LedgerPeriodFilter
                period={period}
                custom={customRange}
                onPeriodChange={setPeriod}
                  onCustomChange={setCustomRange}
                />
              </div>
              {personFilter || period !== 'all' ? (
                <button
                  type="button"
                  className="ledger-filter-clear"
                  onClick={() => {
                    setPersonFilter('');
                    setPeriod('all');
                    setCustomRange({});
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                  Clear
                </button>
              ) : null}
            </div>
          </div>
          <div
            className="ledger-kpi-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${visibleKpis.length}, minmax(0, 1fr))`,
              gap: 20,
              marginBottom: spacing[6],
            }}
          >
            {visibleKpis.map((kpi) => {
              const tone = metricColors[kpi.color];
              const empty = totalsByTab[kpi.id] === 0;
              return (
                <article key={kpi.id} className={`kpi-card${empty ? ' kpi-card--empty' : ''}`} style={{ opacity: empty ? 0.92 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                    <span
                      style={{
                        fontSize: typography.roles.cardLabel.fontSize,
                        fontWeight: typography.roles.cardLabel.fontWeight,
                        color: theme['text-secondary'],
                      }}
                    >
                      {kpi.label}
                    </span>
                    <span className="kpi-icon-bubble" style={{ background: tone.bg, color: tone.icon, borderRadius: radius.pill }}>
                      {kpi.icon}
                    </span>
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div
                      style={{
                        fontSize: typography.roles.kpiValue.fontSize,
                        fontWeight: typography.roles.kpiValue.fontWeight,
                        color: empty ? theme['text-muted'] : theme['text-primary'],
                      }}
                    >
                      {displayByTab[kpi.id]}
                    </div>
                    <div style={{ fontSize: typography.roles.helperText.fontSize, marginTop: 6, color: theme['text-muted'] }}>
                      {kpi.getHint(rangeLabel, companyWide)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div
            className="ledger-sections-grid"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleKpis.length}, minmax(0, 1fr))`, gap: 20 }}
          >
            {visibleKpis.map((kpi) => (
              <LedgerSection
                key={kpi.id}
                tab={kpi.id}
                entries={entriesByTab[kpi.id]}
                resetKey={rangeLabel}
                periodLabel={periodLabel}
                emptyDescription={
                  period !== 'all'
                    ? `Nothing recorded for ${rangeLabel}. Try a wider period.`
                    : emptyHint(kpi.id, companyWide)
                }
                onAdd={companyWide ? () => openEntryModal(kpi.id === 'receipts' ? 'receipt' : 'expense') : undefined}
              />
            ))}
          </div>

          {companyWide ? (
            <div className="dash-card" style={{ padding: spacing[5], marginTop: spacing[6] }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4] }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: theme['text-primary'] }}>
                  Company ledger
                </h2>
                <span style={{ color: theme['text-secondary'], fontSize: 14, fontWeight: 500 }}>
                  {companyFiltered
                    ? `${filteredCompanyEntries.length} of ${companyEntries.length} entries`
                    : `All credits and debits · ${companyEntries.length}`}
                </span>
              </div>
              {companyEntries.length > 0 ? (
                <div className="ledger-company-toolbar">
                  <div className="reviews-filters" role="tablist" aria-label="Filter by transaction type">
                    {[{ kind: 'all', label: 'All types', count: companyEntries.length }, ...companyKinds].map((option) => (
                      <button
                        key={option.kind}
                        type="button"
                        role="tab"
                        aria-selected={companyKind === option.kind}
                        className={`reviews-filter${companyKind === option.kind ? ' is-active' : ''}`}
                        onClick={() => setCompanyKind(option.kind)}
                      >
                        {option.label}
                        <span className="reviews-filter-count">{option.count}</span>
                      </button>
                    ))}
                  </div>
                  <div className="ledger-company-toolbar-end">
                    <div className="ledger-filter-period">
                      <LedgerPeriodFilter
                        period={companyPeriod}
                        custom={companyCustom}
                        onPeriodChange={setCompanyPeriod}
                        onCustomChange={setCompanyCustom}
                        options={COMPANY_PERIODS}
                        ariaLabel="Company ledger period"
                      />
                    </div>
                    {companyFiltered ? (
                      <button
                        type="button"
                        className="ledger-filter-clear"
                        onClick={() => {
                          setCompanyKind('all');
                          setCompanyPeriod('all');
                          setCompanyCustom({});
                        }}
                      >
                        × Clear
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {companyEntries.length === 0 ? (
                  <EmptyState compact title="No company entries yet" description="Credits and debits on the company ledger appear here." />
                ) : filteredCompanyEntries.length === 0 ? (
                  <EmptyState compact title="No matching entries" description="Try another transaction type or a wider date range." />
                ) : (
                  groupByDate(companyPagination.pageItems).map((group) => (
                    <div key={group.date} className="ledger-company-group">
                      <div className="ledger-company-date">{group.date}</div>
                      {group.entries.map((entry) => (
                        <CompanyEntryRow key={entry.id} entry={entry} showOwner={combinedView} />
                      ))}
                    </div>
                  ))
                )}
              </div>
              <TablePager
                page={companyPagination.page}
                pageSize={companyPagination.pageSize}
                total={companyPagination.total}
                onPageChange={companyPagination.setPage}
                className="mis-table-footer"
              />
            </div>
          ) : null}
        </>
      )}

      <TopUpModal
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onSubmit={handleTopUp}
        submitting={topUpSubmitting}
        error={topUpError}
      />
      <AddCompanyEntryModal
        key={entryOpen ? `open-${entryKind}` : 'closed'}
        open={entryOpen}
        kind={entryKind}
        onClose={() => setEntryOpen(false)}
        onSubmit={handleAddEntry}
        submitting={entrySubmitting}
        error={entryError}
      />
      <AddFundsModal
        key={fundsOpen ? 'open' : 'closed'}
        open={fundsOpen}
        onClose={() => setFundsOpen(false)}
        onSubmit={handleAddFunds}
        submitting={fundsSubmitting}
        error={fundsError}
      />
    </section>
  );
}
