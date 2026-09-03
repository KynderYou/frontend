/** Main / sub pattern catalog — matches legacy Midna talent-mapping portal. */

export const MAIN_FINGERPRINT_PATTERNS = ['ULOOP', 'WHORL', 'DLOOP', 'ARCH', 'RLOOP'] as const;

export type MainFingerprintPattern = (typeof MAIN_FINGERPRINT_PATTERNS)[number];

export const SUB_PATTERNS_BY_MAIN: Record<MainFingerprintPattern, readonly string[]> = {
  ULOOP: ['A1', 'A2', 'A3', 'A4'],
  WHORL: ['C1', 'C2', 'C3', 'C4'],
  DLOOP: ['D1', 'D2', 'D3', 'D4'],
  ARCH: ['R1', 'R2', 'R3', 'R4'],
  RLOOP: ['X1', 'X2', 'X3', 'X4'],
};

export const ALL_FINGERS = ['L1', 'L2', 'L3', 'L4', 'L5', 'R1', 'R2', 'R3', 'R4', 'R5'] as const;

export function normalizeMainPattern(value: string | undefined): MainFingerprintPattern | '' {
  const upper = (value ?? '').trim().toUpperCase();
  if ((MAIN_FINGERPRINT_PATTERNS as readonly string[]).includes(upper)) {
    return upper as MainFingerprintPattern;
  }
  return '';
}

export function subPatternsForMain(main: string): string[] {
  const normalized = normalizeMainPattern(main);
  if (!normalized) return [];
  return [...SUB_PATTERNS_BY_MAIN[normalized]];
}
