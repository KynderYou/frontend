import { colors, spacing } from '../../styles/theme';

const theme = colors.light;

export function AdminReadOnlyNote() {
  return (
    <p style={{ margin: `${spacing[3]} 0 0`, fontSize: 12, color: theme['text-muted'] }}>
      Members fill personal and professional details on their profile. Admin sections stay read-only for them.
    </p>
  );
}
