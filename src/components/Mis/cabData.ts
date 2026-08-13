/** CAB debit queue — counselling audio bytes taken by mentees from mentors. */

import { mentors, trainees } from '../Trainees/traineesMockData';
import { formatDuration } from '../Reports/reportTypes';

export type CabDebitStatus = 'Pending' | 'Debited';

export type CabAudioFile = {
  id: string;
  title: string;
  fileName: string;
  durationSec: number;
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

export const cabDebitRecords: CabDebitRecord[] = [
  {
    id: 'cab-1',
    scanId: 'S42487',
    clientName: 'RUDRA VIJ',
    mentorId: 'mentor-madhu',
    mentorName: 'Madhu Sharma',
    menteeId: 't1',
    menteeName: 'Robert Fox',
    audio: { id: 'a1', title: 'Learning style overview', fileName: 'cab_S42487_learning.mp3', durationSec: 184 },
    debitAmount: '₹350',
    status: 'Pending',
  },
  {
    id: 'cab-2',
    scanId: 'S42487',
    clientName: 'RUDRA VIJ',
    mentorId: 'mentor-madhu',
    mentorName: 'Madhu Sharma',
    menteeId: 't1',
    menteeName: 'Robert Fox',
    audio: { id: 'a2', title: 'Career pathway guidance', fileName: 'cab_S42487_career.mp3', durationSec: 236 },
    debitAmount: '₹350',
    status: 'Pending',
  },
  {
    id: 'cab-3',
    scanId: 'S42701',
    clientName: 'Aarav Mehta',
    mentorId: 'mentor-madhu',
    mentorName: 'Madhu Sharma',
    menteeId: 't2',
    menteeName: 'Esther Howard',
    audio: { id: 'a3', title: 'Parent counselling notes', fileName: 'cab_S42701_parent.mp3', durationSec: 152 },
    debitAmount: '₹350',
    status: 'Debited',
    debitedAt: '28 Jul 2026',
  },
  {
    id: 'cab-4',
    scanId: 'S42486',
    clientName: 'Riya Saravanan',
    mentorId: 'mentor-priya',
    mentorName: 'Priya Nair',
    menteeId: 't6',
    menteeName: 'Courtney Henry',
    audio: { id: 'a4', title: 'Intelligence distribution', fileName: 'cab_S42486_intel.mp3', durationSec: 152 },
    debitAmount: '₹350',
    status: 'Pending',
  },
  {
    id: 'cab-5',
    scanId: 'S42486',
    clientName: 'Riya Saravanan',
    mentorId: 'mentor-priya',
    mentorName: 'Priya Nair',
    menteeId: 't6',
    menteeName: 'Courtney Henry',
    audio: { id: 'a5', title: 'Premium deep-dive session', fileName: 'cab_S42486_premium.mp3', durationSec: 318 },
    debitAmount: '₹500',
    status: 'Pending',
  },
  {
    id: 'cab-6',
    scanId: 'S42668',
    clientName: 'ANMOL VIJ',
    mentorId: 'mentor-arjun',
    mentorName: 'Arjun Dev',
    menteeId: 't9',
    menteeName: 'Ananya Krishnan',
    audio: { id: 'a6', title: 'Business aptitude review', fileName: 'cab_S42668_business.mp3', durationSec: 201 },
    debitAmount: '₹350',
    status: 'Pending',
  },
  {
    id: 'cab-7',
    scanId: 'S42710',
    clientName: 'Isha Nair',
    mentorId: 'mentor-rathina',
    mentorName: 'Rathinaswamy A',
    menteeId: 't11',
    menteeName: 'Meera Iyer',
    audio: { id: 'a7', title: 'Student counselling byte', fileName: 'cab_S42710_student.mp3', durationSec: 168 },
    debitAmount: '₹350',
    status: 'Pending',
  },
];

/** Demo mentor login — replace with auth member → mentor mapping. */
export const CURRENT_CAB_MENTOR_ID = 'mentor-madhu';

export function cabCountFor(mentorId: string, records: CabDebitRecord[] = cabDebitRecords): number {
  return records.filter((row) => row.mentorId === mentorId).length;
}

export function pendingCabCountFor(mentorId: string, records: CabDebitRecord[] = cabDebitRecords): number {
  return records.filter((row) => row.mentorId === mentorId && row.status === 'Pending').length;
}

export function menteeNameFor(id: string): string {
  return trainees.find((t) => t.id === id)?.name ?? id;
}

export function formatAudioLabel(audio: CabAudioFile): string {
  return `${audio.title} · ${formatDuration(audio.durationSec)}`;
}

export { mentors };
