import type { CabStateApi } from '../../api/types';
import type { Mentor } from '../Trainees/traineesData';
import type { CabDebitRecord, CabDebitStatus } from './cabData';

export function mapCabState(state: CabStateApi): { mentors: Mentor[]; records: CabDebitRecord[] } {
  return {
    mentors: state.mentors.map((mentor) => ({
      id: String(mentor.id),
      name: mentor.name,
      email: mentor.email,
      role: mentor.role,
      region: mentor.region,
      traineeCount: mentor.trainee_count,
    })),
    records: state.records.map((row) => ({
      id: String(row.id),
      scanId: row.scan_id,
      clientName: row.client_name,
      mentorId: String(row.mentor_id),
      mentorName: row.mentor_name,
      menteeId: String(row.mentee_id),
      menteeName: row.mentee_name,
      audio: {
        id: String(row.audio.id),
        title: row.audio.title,
        fileName: row.audio.file_name,
        durationSec: row.audio.duration_sec,
      },
      debitAmount: row.debit_amount,
      status: row.status as CabDebitStatus,
      debitedAt: row.debited_at ?? undefined,
    })),
  };
}

export function cabCountFor(mentorId: string, records: CabDebitRecord[]): number {
  return records.filter((row) => row.mentorId === mentorId).length;
}

export function pendingCabCountFor(mentorId: string, records: CabDebitRecord[]): number {
  return records.filter((row) => row.mentorId === mentorId && row.status === 'Pending').length;
}
