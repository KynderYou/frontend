import { useEffect, useMemo, useState } from 'react';
import { addCompanyEntry, addCompanyFunds, ApiError, getMyLedger, submitLedgerTopUp } from '../../api';
import type { LedgerEntryRow } from '../../api';
import type { CompanyLedgerEntryApi } from '../../api/types';
import { colors, metricColors, radius, shadow, spacing, typography, type MetricColor } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { ExpensesChart } from './ExpensesChart';
import { TopUpModal } from './TopUpModal';
import { AddCompanyEntryModal } from './AddCompanyEntryModal';
import { AddFundsModal } from './AddFundsModal';
import { LedgerPeriodFilter } from './LedgerPeriodFilter';
import { ledgerRange, ledgerRangeLabel, type LedgerPeriod, type LedgerRange } from './ledgerPeriod';
import { SkeletonLedgerBody, SkeletonSubtitle } from '../common/Skeleton';

const theme = colors.light;
const LEDGER_TX_PAGE_SIZE = 10;
const COMPANY_LEDGER_PAGE_SIZE = 10;

type LedgerTab = 'topups' | 'receipts' | 'billing';

type KpiDef = {
  id: LedgerTab;
  label: string;
  getHint: (rangeLabel: string, companyWide: boolean) => string;
  color: MetricColor;
  icon: React.ReactNode;
  memberOnly?: boolean;
};

const kpis: KpiDef[] = [
  {
    id: 'topups',
    label: 'Total Top-ups',
    getHint: (rangeLabel) => `${rangeLabel} · funds you added`,
    color: 'blue',
    memberOnly: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    ),
  },
  {
    id: 'receipts',
    label: 'Total Receipts',
    getHint: (rangeLabel, companyWide) => `${rangeLabel} · ${companyWide ? 'all company credits' : 'report & CAB credits'}`,
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
    label: 'Total Expenses',
    getHint: (rangeLabel, companyWide) => (companyWide ? `${rangeLabel} · incl. CAB payouts` : rangeLabel),
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

const TAB_TITLES: Record<LedgerTab, string> = { topups: 'Top-ups', receipts: 'Receipts', billing: 'Expenses' };

type LedgerPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

type CompanySector = { label: string; tone: string; icon: React.ReactNode; fallbackDetail?: string };

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
  report_credit: COMPANY_SECTORS.report_billing,
  cab_credit: COMPANY_SECTORS.cab_payout,
  receipt: COMPANY_SECTORS.manual_receipt,
  billing: { ...COMPANY_SECTORS.manual_expense, label: 'Billing' },
  debit: { ...COMPANY_SECTORS.manual_expense, label: 'Billing' },
};

const SECTOR_TITLE_PREFIXES = ['Report billing · ', 'CAB credit · ', 'Top-up credit · '];

const FALLBACK_SECTOR: CompanySector = { label: 'Other', tone: 'slate', icon: COMPANY_SECTORS.funds.icon };

type SectorRowProps = { kind: string; title: string; amount: string; isCredit: boolean; createdBy?: string | null };

function SectorRow({ kind, title, amount, isCredit, createdBy }: SectorRowProps) {
  const sector = SECTORS[kind] ?? FALLBACK_SECTOR;
  const prefix = SECTOR_TITLE_PREFIXES.find((p) => title.startsWith(p));
  const stripped = prefix ? title.slice(prefix.length) : title;
  const detail = stripped && stripped !== sector.label ? stripped : sector.fallbackDetail ?? stripped;
  const description = createdBy ? `${detail} · ${createdBy}` : detail;
  return (
    <div className={`ledger-company-row tone-${sector.tone}`}>
      <span className="ledger-company-icon">{sector.icon}</span>
      <div className="ledger-company-text">
        <span className="ledger-company-sector">{sector.label}</span>
        <span className="ledger-company-desc" title={description}>
          {description}
        </span>
      </div>
      <span className={`ledger-company-amount ${isCredit ? 'is-credit' : 'is-debit'}`}>
        {isCredit ? '+' : '−'}
        {amount}
      </span>
    </div>
  );
}

function CompanyEntryRow({ entry }: { entry: CompanyLedgerEntryApi }) {
  return (
    <SectorRow kind={entry.kind} title={entry.title} amount={entry.amount} isCredit={entry.is_credit} createdBy={entry.created_by} />
  );
}

function TransactionRow({ tx, isCredit }: { tx: LedgerEntryRow; isCredit: boolean }) {
  return <SectorRow kind={tx.kind ?? ''} title={tx.title} amount={tx.amount} isCredit={tx.is_credit ?? isCredit} />;
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
  const [activeTab, setActiveTab] = useState<LedgerTab>('receipts');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
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
  const [entrySubmitting, setEntrySubmitting] = useState(false);
  const [entryError, setEntryError] = useState('');
  const [period, setPeriod] = useState<LedgerPeriod>('all');
  const [customRange, setCustomRange] = useState<LedgerRange>({});
  const [reloadKey, setReloadKey] = useState(0);
  const range = useMemo(() => ledgerRange(period, customRange), [period, customRange]);
  const rangeLabel = ledgerRangeLabel(period, range);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyLedger(undefined, range)
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
  }, [range, reloadKey]);

  const companyWide = data?.company_wide ?? false;
  const entriesByTab: Record<LedgerTab, LedgerEntryRow[]> = {
    topups: data?.topups ?? [],
    receipts: data?.receipts ?? [],
    billing: data?.billing ?? [],
  };
  const totalsByTab: Record<LedgerTab, number> = {
    topups: data?.kpis.total_topups ?? 0,
    receipts: data?.kpis.total_receipts ?? 0,
    billing: data?.kpis.billing_last_30_days ?? 0,
  };
  const displayByTab: Record<LedgerTab, string> = {
    topups: data?.kpis.topups_display ?? '₹0',
    receipts: data?.kpis.receipts_display ?? '₹0',
    billing: data?.kpis.billing_display ?? '₹0',
  };
  const visibleKpis = kpis.filter((kpi) => !(kpi.memberOnly && companyWide));
  const companyEntries = data?.company_entries ?? [];
  const companyPagination = useClientPagination(companyEntries, COMPANY_LEDGER_PAGE_SIZE, 'company');

  const transactions = entriesByTab[activeTab];
  const txPagination = useClientPagination(transactions, LEDGER_TX_PAGE_SIZE, `${activeTab}|${rangeLabel}`);
  const tableTitle = TAB_TITLES[activeTab];
  const periodLabel = companyWide ? `${rangeLabel} · all members` : rangeLabel;
  const initialLoading = loading && data === null;

  const chartData = useMemo(
    () => (data?.expenses_by_month ?? []).map((bar) => ({ label: bar.label, value: bar.value })),
    [data?.expenses_by_month],
  );

  const handleTopUp = async (amount: string, proof: File) => {
    setTopUpSubmitting(true);
    setTopUpError('');
    try {
      await submitLedgerTopUp(amount, proof);
      setReloadKey((key) => key + 1);
      setTopUpOpen(false);
      setActiveTab('topups');
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
      const ledger = await addCompanyFunds(amount);
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

  const entryKind = activeTab === 'receipts' ? 'receipt' : 'expense';

  const openEntryModal = () => {
    setEntryError('');
    setEntryOpen(true);
  };

  const handleAddEntry = async (title: string, amount: string) => {
    setEntrySubmitting(true);
    setEntryError('');
    try {
      await addCompanyEntry(entryKind, title, amount);
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
            My Ledger
          </h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0', fontSize: 14, color: theme['text-secondary'] }}>
            {initialLoading ? (
              <SkeletonSubtitle />
            ) : companyWide ? (
              'Company-wide receipts and expenses across all members.'
            ) : (
              'Track receipts and expenses across your network.'
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
      <div
        className="dash-card ledger-topup-banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing[4],
          flexWrap: 'wrap',
          marginBottom: spacing[5],
          padding: `${spacing[4]} ${spacing[5]}`,
          background: 'linear-gradient(135deg, #EEF0FF 0%, #F8F0FC 55%, #FFFFFF 100%)',
          boxShadow: shadow.card,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              background: 'var(--btn-primary-gradient)',
              boxShadow: shadow.soft,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: theme['text-primary'], letterSpacing: '-0.01em' }}>
              Top up your ledger
            </div>
            <div style={{ fontSize: 13, color: theme['text-secondary'], marginTop: 2 }}>
              Send funds and upload payment proof to credit your balance.
            </div>
          </div>
        </div>
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
      </div>
      ) : null}

      {!initialLoading && companyWide ? (
        <div className="dash-card ledger-topup-banner ledger-company-banner">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme['text-secondary'] }}>Company ledger balance</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme['text-primary'], letterSpacing: '-0.02em', marginTop: 4 }}>
              {data?.available_balance_display ?? '₹0'}
            </div>
            <div style={{ fontSize: 13, color: theme['text-muted'], marginTop: 2 }}>
              Shared by Master Admin and H.O · mentor CAB credits are paid from here.
            </div>
          </div>
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
        </div>
      ) : null}

      {initialLoading ? (
        <SkeletonLedgerBody />
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing[3],
              flexWrap: 'wrap',
              marginBottom: spacing[4],
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: theme['text-secondary'] }}>
              Showing {rangeLabel.toLowerCase().startsWith('all') ? 'all transactions' : rangeLabel}
              {loading ? ' · updating…' : ''}
            </span>
            <LedgerPeriodFilter
              period={period}
              custom={customRange}
              onPeriodChange={setPeriod}
              onCustomChange={setCustomRange}
            />
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
              const selected = activeTab === kpi.id;
              const hovered = hoveredId === kpi.id;
              const focused = focusedId === kpi.id;
              const showColor = selected || hovered || focused;
              const empty = totalsByTab[kpi.id] === 0;
              const gradient = `linear-gradient(135deg, ${tone.icon} 0%, ${tone.text} 100%)`;

              return (
                <article
                  key={kpi.id}
                  className={`kpi-card kpi-card--link${showColor ? ' is-featured' : ''}${empty ? ' kpi-card--empty' : ''}`}
                  onMouseEnter={() => setHoveredId(kpi.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setFocusedId(kpi.id)}
                  onBlur={() => setFocusedId(null)}
                  onClick={() => setActiveTab(kpi.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveTab(kpi.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  style={{
                    cursor: 'pointer',
                    outline: 'none',
                    background: showColor ? gradient : theme['bg-surface'],
                    boxShadow: showColor ? `0 20px 40px ${tone.icon}55` : hovered ? 'var(--shadow-cardHover)' : undefined,
                    transform: hovered || selected ? 'translateY(-3px)' : undefined,
                    transition: 'background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, color 0.2s ease',
                    opacity: empty ? 0.92 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                    <span
                      style={{
                        fontSize: typography.roles.cardLabel.fontSize,
                        fontWeight: typography.roles.cardLabel.fontWeight,
                        color: showColor ? 'rgba(255, 255, 255, 0.9)' : theme['text-secondary'],
                      }}
                    >
                      {kpi.label}
                    </span>
                    <span
                      className="kpi-icon-bubble"
                      style={{
                        background: showColor ? 'rgba(255, 255, 255, 0.22)' : tone.bg,
                        color: showColor ? '#ffffff' : tone.icon,
                        borderRadius: radius.pill,
                      }}
                    >
                      {kpi.icon}
                    </span>
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div
                      style={{
                        fontSize: typography.roles.kpiValue.fontSize,
                        fontWeight: typography.roles.kpiValue.fontWeight,
                        color: showColor ? '#ffffff' : empty ? theme['text-muted'] : theme['text-primary'],
                      }}
                    >
                      {displayByTab[kpi.id]}
                    </div>
                    <div
                      style={{
                        fontSize: typography.roles.helperText.fontSize,
                        marginTop: 6,
                        color: showColor ? 'rgba(255, 255, 255, 0.78)' : theme['text-muted'],
                      }}
                    >
                      {kpi.getHint(rangeLabel, companyWide)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="ledger-lower">
            <div className="dash-card" style={{ padding: spacing[5] }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing[4],
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: theme['text-primary'] }}>
                    {tableTitle}
                  </h2>
                  {companyWide ? (
                    <button
                      type="button"
                      className="ledger-add-entry-btn"
                      aria-label={entryKind === 'receipt' ? 'Add receipt' : 'Add expense'}
                      title={entryKind === 'receipt' ? 'Add receipt' : 'Add expense'}
                      onClick={openEntryModal}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  ) : null}
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: theme['text-secondary'], fontSize: 13, fontWeight: 500, padding: '4px 2px' }}>
                  {periodLabel}
                </span>
              </div>

              <div key={activeTab} style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'ledger-swap-in 0.22s ease' }}>
                {transactions.length === 0 ? (
                  <EmptyState
                    compact
                    title={`No ${TAB_TITLES[activeTab].toLowerCase()} in this period`}
                    description={
                      period !== 'all'
                        ? `Nothing recorded for ${rangeLabel}. Try a wider period.`
                        : activeTab === 'topups'
                          ? 'Use Top up to add funds to your ledger with a payment proof.'
                          : activeTab === 'receipts'
                            ? companyWide
                              ? 'No company receipt entries recorded yet.'
                              : 'Report billing and CAB credits you earn appear here.'
                            : companyWide
                              ? 'No company expenses recorded yet.'
                              : 'No expenses recorded yet.'
                    }
                  />
                ) : (
                  groupByDate(txPagination.pageItems).map((group) => (
                    <div key={group.date} className="ledger-company-group">
                      <div className="ledger-company-date">{group.date}</div>
                      {group.entries.map((tx) => (
                        <TransactionRow key={tx.id} tx={tx} isCredit={activeTab !== 'billing'} />
                      ))}
                    </div>
                  ))
                )}
              </div>
              <TablePager
                page={txPagination.page}
                pageSize={txPagination.pageSize}
                total={txPagination.total}
                onPageChange={txPagination.setPage}
                className="mis-table-footer"
              />
            </div>

            <ExpensesChart data={chartData} year={data?.expenses_year ?? new Date().getFullYear()} />
          </div>

          {companyWide ? (
            <div className="dash-card" style={{ padding: spacing[5], marginTop: spacing[6] }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4] }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: theme['text-primary'] }}>
                  Company ledger
                </h2>
                <span style={{ color: theme['text-secondary'], fontSize: 13, fontWeight: 500 }}>
                  All credits and debits · {companyEntries.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {companyEntries.length === 0 ? (
                  <EmptyState compact title="No company entries yet" description="Credits and debits on the company ledger appear here." />
                ) : (
                  groupByDate(companyPagination.pageItems).map((group) => (
                    <div key={group.date} className="ledger-company-group">
                      <div className="ledger-company-date">{group.date}</div>
                      {group.entries.map((entry) => (
                        <CompanyEntryRow key={entry.id} entry={entry} />
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
