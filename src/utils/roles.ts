export const SUPER_ADMIN_ROLE = 'Super Admin';

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'Admin' || role === SUPER_ADMIN_ROLE;
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === SUPER_ADMIN_ROLE;
}
