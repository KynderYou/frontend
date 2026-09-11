import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { Member } from '../../api';

type MemberContextValue = {
  member: Member | null;
  setMember: (member: Member | null) => void;
  patchMember: (patch: Partial<Member>) => void;
};

const MemberContext = createContext<MemberContextValue>({
  member: null,
  setMember: () => undefined,
  patchMember: () => undefined,
});

export function MemberProvider({
  member,
  setMember,
  children,
}: {
  member: Member | null;
  setMember: (member: Member | null) => void;
  children: ReactNode;
}) {
  const patchMember = useCallback(
    (patch: Partial<Member>) => {
      setMember(member ? { ...member, ...patch } : member);
    },
    [member, setMember],
  );

  const value = useMemo(
    () => ({ member, setMember, patchMember }),
    [member, setMember, patchMember],
  );

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export function useCurrentMember() {
  return useContext(MemberContext).member;
}

export function useMemberActions() {
  const { setMember, patchMember } = useContext(MemberContext);
  return { setMember, patchMember };
}

/** First letter of the member's display name (falls back to email / U). */
export function memberInitial(member: Member | null | undefined): string {
  const source = member?.name?.trim() || member?.mail_id?.trim() || '';
  if (!source) return 'U';
  return source.charAt(0).toUpperCase();
}
