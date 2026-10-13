import {
  LuLayoutDashboard,
  LuScanLine,
  LuBuilding2,
  LuWallet,
  LuFileText,
  LuUsers,
  LuUserCheck,
  LuUserCog,
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
  { id: 'scans-mla', label: 'Upload Scan', Icon: LuScanLine, section: 'Scans', navKey: 'scans_mla' as const },
  { id: 'scans-ho', label: 'Process Scan', Icon: LuBuilding2, section: 'Scans', navKey: 'scans_ho' as const },
  { id: 'ledger', label: 'My Ledger', Icon: LuWallet, section: 'Operations', navKey: 'ledger' as const },
  { id: 'reports', label: 'My Reports', Icon: LuFileText, section: 'Operations' },
  {
    id: 'trainees',
    label: 'My Consultants',
    Icon: LuUsers,
    section: 'Operations',
    navKey: 'ho_trainees' as const,
  },
  { id: 'mlas', label: 'My MLAs', Icon: LuUserCheck, section: 'Operations', navKey: 'ho_mlas' as const },
  { id: 'mentors', label: 'My Mentors', Icon: LuUserCog, section: 'Operations', navKey: 'ho_mlas' as const },
  {
    id: 'mentor-trainees',
    label: 'My Consultants',
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

export function isAppView(value: string): value is AppView {
  return validViews.has(value);
}

type NavItem = (typeof navItems)[number];
type NavKey = Extract<NavItem, { navKey: unknown }>['navKey'];

/** Flags older API responses may omit — default to visible. */
const DEFAULT_VISIBLE = new Set<NavKey>(['mis_cab', 'scans_mla', 'dashboard', 'ledger', 'mis']);

function navAllows(nav: MemberNav, key: NavKey): boolean {
  const value = nav[key];
  if (value === undefined) return DEFAULT_VISIBLE.has(key);
  return value;
}

export function getVisibleNavItems(nav: MemberNav): NavItem[] {
  return navItems.filter((item) => !('navKey' in item) || !item.navKey || navAllows(nav, item.navKey));
}

export function canAccessView(view: AppView, nav: MemberNav): boolean {
  if (view === 'profile' || view === 'notifications') return true;
  const item = navItems.find((entry) => entry.id === view);
  if (!item || !('navKey' in item) || !item.navKey) return true;
  return navAllows(nav, item.navKey);
}

/** Landing page: Dashboard, or Upload Scan for members without a dashboard (trainees). */
export function defaultViewFor(nav: MemberNav | null | undefined): AppView {
  if (!nav || navAllows(nav, 'dashboard')) return 'dashboard';
  if (navAllows(nav, 'scans_mla')) return 'scans-mla';
  return 'profile';
}
