import { shadow } from '../../styles/theme';
import { memberInitial, useCurrentMember } from '../Auth/MemberContext';

type ProfileAvatarButtonProps = {
  onClick?: () => void;
  /** Override when member context is unavailable */
  name?: string;
};

/** Top-right avatar — Midna pink fill, white ring, member initial */
export function ProfileAvatarButton({ onClick, name }: ProfileAvatarButtonProps) {
  const member = useCurrentMember();
  const initial = name?.trim()
    ? name.trim().charAt(0).toUpperCase()
    : memberInitial(member);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="My Profile"
      style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        border: 'none',
        padding: 0,
        flexShrink: 0,
        cursor: 'pointer',
        background: 'var(--color-primary, #DD127B)',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: '-0.01em',
        boxShadow: shadow.avatarRing,
      }}
    >
      {initial}
    </button>
  );
}
