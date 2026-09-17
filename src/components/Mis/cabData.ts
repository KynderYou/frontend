/** CAB debit domain types and helpers. */

import { formatDuration } from '../Reports/reportTypes';

export type CabDebitStatus = 'Pending' | 'Debited';

export type CabAudioFile = {
  id: string;
  title: string;
  fileName: string;
  durationSec: number;
  url?: string | null;
};

export type CabDebitRecord = {
  id: string;
  scanId: string;
  clientName: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  audio: CabAudioFile;
  debitAmount: string;
  status: CabDebitStatus;
  debitedAt?: string;
};

export type CabPendingRequest = {
  scanCode: string;
  clientName: string;
  menteeId: string;
  menteeName: string;
  requestedAt: string;
};

export function formatAudioLabel(audio: CabAudioFile): string {
  return `${audio.title} · ${formatDuration(audio.durationSec)}`;
}
