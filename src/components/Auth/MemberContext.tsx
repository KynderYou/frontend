import { createContext, useContext, type ReactNode } from 'react';
import type { Member } from '../../api';

const MemberContext = createContext<Member | null>(null);

export function MemberProvider({
  member,
  children,
}: {
  member: Member | null;
  children: ReactNode;
}) {
  return <MemberContext.Provider value={member}>{children}</MemberContext.Provider>;
}

export function useCurrentMember() {
  return useContext(MemberContext);
}

/** First letter of the member's display name (falls back to email / U). */
export function memberInitial(member: Member | null | undefined): string {
  const source = member?.name?.trim() || member?.mail_id?.trim() || '';
  if (!source) return 'U';
  return source.charAt(0).toUpperCase();
}
