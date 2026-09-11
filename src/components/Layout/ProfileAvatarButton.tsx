import { useEffect, useState } from 'react';
import { fetchAuthenticatedAsset } from '../../api';
import { shadow } from '../../styles/theme';
import { memberInitial, useCurrentMember } from '../Auth/MemberContext';

type ProfileAvatarButtonProps = {
  onClick?: () => void;
  /** Override when member context is unavailable */
  name?: string;
};

/** Top-right avatar — photo when set, otherwise Midna pink initial */
export function ProfileAvatarButton({ onClick, name }: ProfileAvatarButtonProps) {
  const member = useCurrentMember();
  const initial = name?.trim()
    ? name.trim().charAt(0).toUpperCase()
    : memberInitial(member);
  const avatarPath = member?.avatar_url ?? null;
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarPath) {
      setPhotoUrl(null);
      return undefined;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    fetchAuthenticatedAsset(avatarPath)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPhotoUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatarPath]);

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
        background: photoUrl ? 'transparent' : 'var(--color-primary, #DD127B)',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: '-0.01em',
        boxShadow: shadow.avatarRing,
        overflow: 'hidden',
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          width={42}
          height={42}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        initial
      )}
    </button>
  );
}
