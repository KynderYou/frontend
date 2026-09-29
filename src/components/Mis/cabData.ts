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
  cabAudioId?: string;
};

export type CabPendingRequest = {
  scanCode: string;
  clientName: string;
  menteeId: string;
  menteeName: string;
  requestedAt: string;
  flaggedX: boolean;
};

export type CabApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export type CabUpload = {
  id: string;
  scanCode: string;
  clientName: string;
  flaggedX: boolean;
  mentorId: string;
  mentorName: string;
  menteeName: string;
  audio: CabAudioFile;
  uploadedAt: string;
  approvalStatus: CabApprovalStatus;
  creditAmount: string;
};

/** One uploaded CAB audio with both money flows: mentor credit (upload) and mentee debit (record). */
export type CabEntry = {
  key: string;
  scanCode: string;
  clientName: string;
  flaggedX: boolean;
  mentorId: string;
  mentorName: string;
  menteeName: string;
  audio: CabAudioFile;
  uploadedAt: string;
  upload?: CabUpload;
  debit?: CabDebitRecord;
};

export function buildCabEntries(uploads: CabUpload[], records: CabDebitRecord[]): CabEntry[] {
  const debitByAudio = new Map(records.filter((r) => r.cabAudioId).map((r) => [r.cabAudioId as string, r]));
  const linked = new Set<string>();
  const entries: CabEntry[] = uploads.map((upload) => {
    const debit = debitByAudio.get(upload.id);
    if (debit) linked.add(debit.id);
    return {
      key: `upload-${upload.id}`,
      scanCode: upload.scanCode,
      clientName: upload.clientName,
      flaggedX: upload.flaggedX,
      mentorId: upload.mentorId,
      mentorName: upload.mentorName,
      menteeName: upload.menteeName,
      audio: upload.audio,
      uploadedAt: upload.uploadedAt,
      upload,
      debit,
    };
  });
  for (const debit of records) {
    if (linked.has(debit.id)) continue;
    entries.push({
      key: `debit-${debit.id}`,
      scanCode: debit.scanId,
      clientName: debit.clientName,
      flaggedX: false,
      mentorId: debit.mentorId,
      mentorName: debit.mentorName,
      menteeName: debit.menteeName,
      audio: debit.audio,
      uploadedAt: '',
      debit,
    });
  }
  return entries;
}

export function formatAudioLabel(audio: CabAudioFile): string {
  return `${audio.title} · ${formatDuration(audio.durationSec)}`;
}
