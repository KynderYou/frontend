import type { ScanImage } from './scanTypes';

export type FingerprintGroup = {
  key: string;
  label: string;
  images: ScanImage[];
};

export type HandTabId = 'left' | 'right' | 'other';

export type HandView = {
  id: HandTabId;
  label: string;
  groups: FingerprintGroup[];
};

const viewOrder = ['center', 'left', 'right'];

function viewRank(name: string): number {
  const view = name.replace(/\.[^.]+$/i, '').match(/(center|left|right)$/i)?.[1]?.toLowerCase();
  if (!view) return viewOrder.length;
  const index = viewOrder.indexOf(view);
  return index === -1 ? viewOrder.length : index;
}

export function groupScanImages(images: ScanImage[]): FingerprintGroup[] {
  const groups = new Map<string, ScanImage[]>();
  const other: ScanImage[] = [];

  for (const image of images) {
    const base = image.name.replace(/\.[^.]+$/i, '');
    const match = base.match(/^([LR])(\d+)(Center|Left|Right)$/i);
    if (match) {
      const key = `${match[1].toUpperCase()}${match[2]}`;
      const bucket = groups.get(key) ?? [];
      bucket.push(image);
      groups.set(key, bucket);
      continue;
    }
    other.push(image);
  }

  const grouped: FingerprintGroup[] = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([key, bucket]) => {
      const hand = key[0] === 'L' ? 'Left' : 'Right';
      const finger = key.slice(1);
      return {
        key,
        label: `${hand} ${finger}`,
        images: [...bucket].sort((a, b) => viewRank(a.name) - viewRank(b.name)),
      };
    });

  if (other.length > 0) {
    grouped.push({
      key: 'other',
      label: 'Other images',
      images: other,
    });
  }

  return grouped;
}

export function organizeByHand(groups: FingerprintGroup[]): HandView[] {
  const left: FingerprintGroup[] = [];
  const right: FingerprintGroup[] = [];
  const other: FingerprintGroup[] = [];

  for (const group of groups) {
    if (group.key === 'other') {
      other.push(group);
      continue;
    }
    if (group.key.startsWith('L')) {
      left.push(group);
      continue;
    }
    if (group.key.startsWith('R')) {
      right.push(group);
    }
  }

  const views: HandView[] = [];
  if (left.length > 0) views.push({ id: 'left', label: 'Left', groups: left });
  if (right.length > 0) views.push({ id: 'right', label: 'Right', groups: right });
  if (other.length > 0) views.push({ id: 'other', label: 'Photo', groups: other });
  return views;
}

export function flattenScanImages(groups: FingerprintGroup[]): ScanImage[] {
  return groups.flatMap((group) => group.images);
}

const VIEW_SUFFIX = {
  L: 'Left',
  C: 'Center',
  R: 'Right',
} as const;

export type FingerViewTab = keyof typeof VIEW_SUFFIX;

/** Finger code shown on a left/right panel (e.g. L3 on left when active finger is L3 or R3). */
export function panelFingerForSide(side: 'left' | 'right', activeFinger: string): string {
  const digit = activeFinger.match(/\d+/)?.[0];
  if (digit) {
    return `${side === 'left' ? 'L' : 'R'}${digit}`;
  }
  return side === 'left' ? 'L1' : 'R1';
}

function viewTabFromSuffix(suffix: string): FingerViewTab | null {
  const normalized = suffix.toLowerCase();
  if (normalized === 'left') return 'L';
  if (normalized === 'center') return 'C';
  if (normalized === 'right') return 'R';
  return null;
}

/** Fast lookup map: key is "L1:C", "R3:L", etc. */
export function buildFingerViewIndex(images: ScanImage[]): Map<string, ScanImage> {
  const index = new Map<string, ScanImage>();
  for (const image of images) {
    const base = image.name.replace(/\.[^.]+$/i, '');
    const match = base.match(/^([LR])(\d+)(Center|Left|Right)$/i);
    if (!match) continue;
    const finger = `${match[1].toUpperCase()}${match[2]}`;
    const view = viewTabFromSuffix(match[3]);
    if (view) {
      index.set(`${finger}:${view}`, image);
    }
  }
  return index;
}

export function findFingerViewImage(
  images: ScanImage[],
  finger: string,
  view: FingerViewTab,
  index?: Map<string, ScanImage>,
): ScanImage | undefined {
  const lookup = index ?? buildFingerViewIndex(images);
  const fromIndex = lookup.get(`${finger}:${view}`);
  if (fromIndex) return fromIndex;

  const suffix = VIEW_SUFFIX[view];
  const expected = `${finger}${suffix}`.toLowerCase();
  return images.find((image) => {
    const base = image.name.replace(/\.[^.]+$/i, '');
    return base.toLowerCase() === expected;
  });
}
