import { LuInstagram, LuMic, LuShare2, LuStar } from 'react-icons/lu';
import type { ReviewKind } from '../../api/types';

export type ReviewKindOption = { id: ReviewKind; label: string; tone: string; icon: React.ReactNode };

export const REVIEW_KIND_OPTIONS: ReviewKindOption[] = [
  { id: 'google', label: 'Google', tone: 'blue', icon: <LuStar size={15} /> },
  { id: 'instagram', label: 'Instagram', tone: 'pink', icon: <LuInstagram size={15} /> },
  { id: 'audio', label: 'Audio (MP3)', tone: 'violet', icon: <LuMic size={15} /> },
  { id: 'other', label: 'Other social media', tone: 'teal', icon: <LuShare2 size={15} /> },
];
