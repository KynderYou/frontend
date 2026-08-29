import {
  LuLayoutDashboard,
  LuScanLine,
  LuBuilding2,
  LuWallet,
  LuFileText,
  LuUsers,
  LuUserCheck,
  LuListChecks,
  LuUserPlus,
  LuClipboardList,
  LuMessageSquare,
  LuActivity,
  LuSearch,
} from 'react-icons/lu';
import type { MemberNav } from '../../api/types';

/** Regular nav loop — profile is a separate row pinned to the sidebar footer, not part of this list */
export const navItems = [
  { id: 'dashboard', label: 'Dashboard', Icon: LuLayoutDashboard, section: 'Menu' },
  { id: 'scans-mla', label: 'My Scans (MLA)', Icon: LuScanLine, section: 'Scans' },
  { id: 'scans-ho', label: 'My Scans (H.O)', Icon: LuBuilding2, section: 'Scans' },
  { id: 'ledger', label: 'My Ledger', Icon: LuWallet, section: 'Operations' },
  { id: 'reports', label: 'My Reports', Icon: LuFileText, section: 'Operations' },
  {
    id: 'trainees',
    label: 'My Trainees',
    Icon: LuUsers,
    section: 'Operations',
    navKey: 'ho_trainees' as const,
  },
  { id: 'mlas', label: 'My MLAs', Icon: LuUserCheck, section: 'Operations', navKey: 'ho_mlas' as const },
  {
    id: 'mentor-trainees',
    label: 'Trainee List',
    Icon: LuListChecks,
    section: 'Operations',
    navKey: 'mentor_trainees' as const,
  },
  {
    id: 'mentor-mlas',
    label: 'MLA List',
    Icon: LuListChecks,
    section: 'Operations',
    navKey: 'mentor_mlas' as const,
  },
  { id: 'mis-cab', label: 'CAB', Icon: LuClipboardList, section: 'MIS', navKey: 'mis_cab' as const },
  { id: 'mis-communications', label: 'Communications', Icon: LuMessageSquare, section: 'MIS' },
  { id: 'mis-network', label: 'Network Performance', Icon: LuActivity, section: 'MIS' },
  { id: 'mis-scans', label: 'Scans', Icon: LuSearch, section: 'MIS' },
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

export function getVisibleNavItems(nav: MemberNav): NavItem[] {
  return navItems.filter((item) => {
    if (!('navKey' in item) || !item.navKey) return true;
    if (item.navKey === 'mis_cab') return nav.mis_cab ?? true;
    return nav[item.navKey];
  });
}

export function canAccessView(view: AppView, nav: MemberNav): boolean {
  if (view === 'profile' || view === 'dashboard' || view === 'notifications') return true;
  const item = navItems.find((entry) => entry.id === view);
  if (!item || !('navKey' in item) || !item.navKey) return true;
  if (item.navKey === 'mis_cab') return nav.mis_cab ?? true;
  return nav[item.navKey];
}
