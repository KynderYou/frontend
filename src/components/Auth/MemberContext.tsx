import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { Member } from '../../api';

type MemberContextValue = {
  member: Member | null;
  setMember: Dispatch<SetStateAction<Member | null>>;
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
  setMember: Dispatch<SetStateAction<Member | null>>;
  children: ReactNode;
}) {
  const patchMember = useCallback(
    (patch: Partial<Member>) => {
      setMember((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        const keys = Object.keys(patch) as (keyof Member)[];
        if (keys.every((key) => current[key] === next[key])) return current;
        return next;
      });
    },
    [setMember],
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
