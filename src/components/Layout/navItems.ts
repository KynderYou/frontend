import {
  LuLayoutDashboard,
  LuScanLine,
  LuBuilding2,
  LuWallet,
  LuFileText,
  LuUsers,
  LuUserPlus,
  LuClipboardList,
  LuMessageSquare,
  LuActivity,
  LuSearch,
} from 'react-icons/lu';

/** Regular nav loop — profile is a separate row pinned to the sidebar footer, not part of this list */
export const navItems = [
  { id: 'dashboard', label: 'Dashboard', Icon: LuLayoutDashboard, section: 'Menu' },
  { id: 'scans-mla', label: 'My Scans (MLA)', Icon: LuScanLine, section: 'Scans' },
  { id: 'scans-ho', label: 'My Scans (H.O)', Icon: LuBuilding2, section: 'Scans' },
  { id: 'ledger', label: 'My Ledger', Icon: LuWallet, section: 'Operations' },
  { id: 'reports', label: 'My Reports', Icon: LuFileText, section: 'Operations' },
  { id: 'trainees', label: 'My Trainees', Icon: LuUsers, section: 'Operations' },
  { id: 'mis-cab', label: 'CAB', Icon: LuClipboardList, section: 'MIS' },
  { id: 'mis-communications', label: 'Communications', Icon: LuMessageSquare, section: 'MIS' },
  { id: 'mis-network', label: 'Network Performance', Icon: LuActivity, section: 'MIS' },
  { id: 'mis-scans', label: 'Scans', Icon: LuSearch, section: 'MIS' },
  { id: 'admin-members', label: 'Member Accounts', Icon: LuUserPlus, section: 'Admin' },
] as const;

export type AppView = (typeof navItems)[number]['id'] | 'profile';

const validViews = new Set<string>([...navItems.map((item) => item.id), 'profile']);

export function isAppView(value: string): value is AppView {
  return validViews.has(value);
}
