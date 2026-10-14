import {
  LuLayoutDashboard,
  LuScanLine,
  LuWallet,
  LuFileText,
  LuUsers,
  LuUserCheck,
  LuNetwork,
  LuUserPlus,
  LuClipboardList,
  LuMessageSquare,
  LuActivity,
  LuSearch,
  LuMessageSquareQuote,
} from 'react-icons/lu';
import type { MemberNav } from '../../api/types';

/** Regular nav loop — profile is a separate row pinned to the sidebar footer, not part of this list */
export const navItems = [
  { id: 'dashboard', label: 'Dashboard', Icon: LuLayoutDashboard, section: 'Menu', navKey: 'dashboard' as const },
  { id: 'scans', label: 'Scans', Icon: LuScanLine, section: 'Scans' },
  { id: 'ledger', label: 'My Ledger', Icon: LuWallet, section: 'Operations', navKey: 'ledger' as const },
  { id: 'reports', label: 'My Reports', Icon: LuFileText, section: 'Operations' },
  { id: 'network', label: 'Network', Icon: LuNetwork, section: 'Operations', navKey: 'ho_mlas' as const },
  {
    id: 'mentor-trainees',
    label: 'My Counselors',
    Icon: LuUsers,
    section: 'Operations',
    navKey: 'mentor_trainees' as const,
  },
  {
    id: 'mentor-mlas',
    label: 'My MLAs',
    Icon: LuUserCheck,
    section: 'Operations',
    navKey: 'mentor_mlas' as const,
  },
  { id: 'mis-cab', label: 'CAB', Icon: LuClipboardList, section: 'MIS', navKey: 'mis_cab' as const },
  { id: 'mis-communications', label: 'Communications', Icon: LuMessageSquare, section: 'MIS', navKey: 'mis' as const },
  { id: 'mis-network', label: 'Network Performance', Icon: LuActivity, section: 'MIS', navKey: 'mis' as const },
  { id: 'mis-scans', label: 'Scans', Icon: LuSearch, section: 'MIS', navKey: 'mis' as const },
  { id: 'mis-reviews', label: 'Reviews', Icon: LuMessageSquareQuote, section: 'MIS', navKey: 'mis' as const },
  {
    id: 'admin-members',
    label: 'Member Accounts',
    Icon: LuUserPlus,
    section: 'Admin',
    navKey: 'admin_members' as const,
  },
  {
    id: 'admin-topups',
    label: 'Top-up Requests',
    Icon: LuWallet,
    section: 'Admin',
    navKey: 'admin_topups' as const,
  },
] as const;

export type AppView = (typeof navItems)[number]['id'] | 'profile' | 'notifications';

const validViews = new Set<string>([...navItems.map((item) => item.id), 'profile', 'notifications']);

/** Upload Scan and Process Scan were merged into Scans; old links and notifications still use these. */
const VIEW_ALIASES: Record<string, AppView> = {
  'scans-mla': 'scans',
  'scans-ho': 'scans',
  trainees: 'network',
  mlas: 'network',
  mentors: 'network',
};

export function resolveView(value: string): AppView | null {
  if (validViews.has(value)) return value as AppView;
  return VIEW_ALIASES[value] ?? null;
}

export function isAppView(value: string): value is AppView {
  return validViews.has(value);
}

type NavItem = (typeof navItems)[number];
type NavKey = keyof MemberNav;

/** Flags older API responses may omit — default to visible. */
const DEFAULT_VISIBLE = new Set<NavKey>(['mis_cab', 'scans_mla', 'dashboard', 'ledger', 'mis']);

function navAllows(nav: MemberNav, key: NavKey): boolean {
  const value = nav[key];
  if (value === undefined) return DEFAULT_VISIBLE.has(key);
  return Boolean(value);
}

export function canUploadScans(nav: MemberNav): boolean {
  return navAllows(nav, 'scans_mla');
}

export function canProcessScans(nav: MemberNav): boolean {
  return navAllows(nav, 'scans_ho');
}

function itemAllowed(item: NavItem, nav: MemberNav): boolean {
  if (item.id === 'scans') return canUploadScans(nav) || canProcessScans(nav);
  if (item.id === 'network') return navAllows(nav, 'ho_mlas') || navAllows(nav, 'ho_trainees');
  return !('navKey' in item) || !item.navKey || navAllows(nav, item.navKey);
}

/** Admins manage everyone, so their menu reads "Ledger", "Counselors", … instead of "My …". */
export function navLabel(label: string, isAdmin: boolean): string {
  return isAdmin ? label.replace(/^My /, '') : label;
}

export function isAdminNav(nav: MemberNav): boolean {
  return Boolean(nav.admin_members);
}

export function getVisibleNavItems(nav: MemberNav): NavItem[] {
  return navItems.filter((item) => itemAllowed(item, nav));
}

export function canAccessView(view: AppView, nav: MemberNav): boolean {
  if (view === 'profile' || view === 'notifications') return true;
  const item = navItems.find((entry) => entry.id === view);
  return !item || itemAllowed(item, nav);
}

/** Landing page: Dashboard, or Scans for members without a dashboard (counselors). */
export function defaultViewFor(nav: MemberNav | null | undefined): AppView {
  if (!nav || navAllows(nav, 'dashboard')) return 'dashboard';
  if (canUploadScans(nav)) return 'scans';
  return 'profile';
}
