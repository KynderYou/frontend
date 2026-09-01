import { useEffect, useMemo, useState } from 'react';
import { getMyLedger, submitLedgerTopUp } from '../../api';
import type { LedgerEntryRow } from '../../api';
import { colors, metricColors, radius, shadow, spacing, typography, type MetricColor } from '../../styles/theme';
import { EmptyState } from '../common/EmptyState';
import { TablePager } from '../common/TablePager';
import { useToast } from '../common/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import { NotificationButton } from '../Layout/NotificationButton';
import { ProfileAvatarButton } from '../Layout/ProfileAvatarButton';
import { ExpensesChart } from './ExpensesChart';
import { TopUpModal } from './TopUpModal';

const theme = colors.light;
const LEDGER_TX_PAGE_SIZE = 12;

type LedgerTab = 'receipts' | 'billing';

type KpiDef = {
  id: LedgerTab;
  label: string;
  getValue: (receiptsDisplay: string, billingDisplay: string) => string;
  getHint: (billingWindowDays: number) => string;
  color: MetricColor;
  icon: React.ReactNode;
  isEmpty?: (receiptsTotal: number, billingTotal: number) => boolean;
};

const kpis: KpiDef[] = [
  {
    id: 'receipts',
    label: 'Total Receipts',
    getValue: (receiptsDisplay) => receiptsDisplay,
    getHint: () => 'Credits received',
    color: 'green',
    isEmpty: (receiptsTotal) => receiptsTotal === 0,
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
    getValue: (_receipts, billingDisplay) => billingDisplay,
    getHint: (days) => `Last ${days} days`,
    color: 'purple',
    isEmpty: (_receipts, billingTotal) => billingTotal === 0,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M3 10h18" />
        <circle cx="16" cy="14.5" r="1.6" />
      </svg>
    ),
  },
];

type LedgerPageProps = {
  onOpenMobileMenu?: () => void;
  onOpenProfile?: () => void;
};

function TransactionRow({ tx }: { tx: LedgerEntryRow }) {
  return (
    <div
      className="ledger-tx-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: radius.md,
        background: theme['bg-muted'],
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: tx.pastel,
          color: theme['text-primary'],
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          boxShadow: shadow.float,
        }}
      >
        {tx.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme['text-primary'] }}>{tx.title}</div>
        <div style={{ fontSize: 12, color: theme['text-muted'], marginTop: 2 }}>{tx.date}</div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: theme['text-primary'], whiteSpace: 'nowrap' }}>{tx.amount}</div>
    </div>
  );
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyLedger()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoadError('');
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Unable to load ledger.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const receipts = data?.receipts ?? [];
  const billing = data?.billing ?? [];
  const billingWindowDays = data?.billing_window_days ?? 30;
  const receiptsTotal = data?.kpis.total_receipts ?? 0;
  const billingTotal = data?.kpis.billing_last_30_days ?? 0;
  const receiptsDisplay = data?.kpis.receipts_display ?? '₹0';
  const billingDisplay = data?.kpis.billing_display ?? '₹0';

  const transactions = activeTab === 'receipts' ? receipts : billing;
  const txPagination = useClientPagination(transactions, LEDGER_TX_PAGE_SIZE, activeTab);
  const tableTitle = activeTab === 'receipts' ? 'Receipts' : 'Billing';
  const periodLabel = activeTab === 'billing' ? `Last ${billingWindowDays} days` : 'All credits';

  const chartData = useMemo(
    () => (data?.expenses_by_month ?? []).map((bar) => ({ label: bar.label, value: bar.value })),
    [data?.expenses_by_month],
  );

  const handleTopUp = async (amount: string, proof: File) => {
    setTopUpSubmitting(true);
    setTopUpError('');
    try {
      await submitLedgerTopUp(amount, proof);
      setTopUpOpen(false);
      const formatted = amount.trim().replace(/^₹\s*/, '');
      showSuccess(
        `Top-up of ₹${formatted} submitted successfully. Admin will verify your payment proof and credit your ledger shortly.`,
      );
    } catch {
      const message = 'Could not submit top up. Check amount and proof, then try again.';
      setTopUpError(message);
      showError(message);
    } finally {
      setTopUpSubmitting(false);
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
            Track receipts and billing across your network.
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

      {loading ? (
        <p style={{ marginBottom: spacing[6], color: theme['text-secondary'], fontSize: 14 }}>Loading ledger…</p>
      ) : (
        <>
          <div
            className="ledger-kpi-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 20,
              marginBottom: spacing[6],
            }}
          >
            {kpis.map((kpi) => {
              const tone = metricColors[kpi.color];
              const selected = activeTab === kpi.id;
              const hovered = hoveredId === kpi.id;
              const focused = focusedId === kpi.id;
              const showColor = selected || hovered || focused;
              const empty = kpi.isEmpty?.(receiptsTotal, billingTotal) ?? false;
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
                      {kpi.getValue(receiptsDisplay, billingDisplay)}
                    </div>
                    <div
                      style={{
                        fontSize: typography.roles.helperText.fontSize,
                        marginTop: 6,
                        color: showColor ? 'rgba(255, 255, 255, 0.78)' : theme['text-muted'],
                      }}
                    >
                      {kpi.getHint(billingWindowDays)}
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
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: theme['text-primary'] }}>
                  {tableTitle}
                </h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: theme['text-secondary'], fontSize: 13, fontWeight: 500, padding: '4px 2px' }}>
                  {periodLabel}
                </span>
              </div>

              <div key={activeTab} style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'ledger-swap-in 0.22s ease' }}>
                {transactions.length === 0 ? (
                  <EmptyState
                    compact
                    title={activeTab === 'receipts' ? 'No receipts yet' : 'No billing this period'}
                    description={
                      activeTab === 'receipts'
                        ? 'Top up your ledger or wait for network credits to appear here.'
                        : `No billing entries in the last ${billingWindowDays} days.`
                    }
                  />
                ) : (
                  txPagination.pageItems.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
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
        </>
      )}

      <TopUpModal
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onSubmit={handleTopUp}
        submitting={topUpSubmitting}
        error={topUpError}
      />
    </section>
  );
}
