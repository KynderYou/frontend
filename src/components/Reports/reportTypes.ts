import type { ScanDetails } from '../Scans/scanTypes';

export type ReportStatus = 'Processing' | 'Ready' | 'Upgraded';

export type ReportPlan = 'Standard' | 'Premium';

export type CabAudio = {
  id: string;
  title: string;
  counsellor: string;
  durationSec: number;
};

export type ReportRecord = {
  id: string;
  scanId: string;
  reportName: string;
  size: string;
  generatedAt: string;
  status: ReportStatus;
  plan: ReportPlan;
  details: ScanDetails;
  cabAudios: CabAudio[];
  cabRequestedAt?: string;
};

/** Seeded records until the reports endpoint is wired up */
export const seedReports: ReportRecord[] = [
  {
    id: 'r1',
    scanId: 'S42487',
    reportName: 'S42487_DMIT_Report.pdf',
    size: '4.6 MB',
    generatedAt: '15 Jul 2026 · 11:40 AM',
    status: 'Ready',
    plan: 'Standard',
    details: {
      clientType: 'Individual',
      referredBy: 'SELF',
      name: 'RUDRA VIJ',
      age: '12',
      phone: '9876543210',
      gender: 'Male',
      mrp: '₹2,000',
    },
    cabAudios: [
      { id: 'a1', title: 'Learning style overview', counsellor: 'Dr. Kavitha R', durationSec: 184 },
      { id: 'a2', title: 'Career pathway guidance', counsellor: 'Dr. Kavitha R', durationSec: 236 },
    ],
  },
  {
    id: 'r2',
    scanId: 'S42486',
    reportName: 'S42486_DMIT_Report.pdf',
    size: '5.1 MB',
    generatedAt: '13 Jul 2026 · 09:15 AM',
    status: 'Upgraded',
    plan: 'Premium',
    details: {
      clientType: 'Individual',
      referredBy: 'SELF',
      name: 'Riya Saravanan',
      age: '10',
      phone: '9123456780',
      gender: 'Female',
      mrp: '₹1,500',
    },
    cabAudios: [
      { id: 'a3', title: 'Intelligence distribution', counsellor: 'Mr. Arjun Dev', durationSec: 152 },
      { id: 'a4', title: 'Parenting recommendations', counsellor: 'Mr. Arjun Dev', durationSec: 264 },
      { id: 'a5', title: 'Premium deep-dive session', counsellor: 'Dr. Kavitha R', durationSec: 318 },
    ],
  },
  {
    id: 'r3',
    scanId: 'S42481',
    reportName: 'S42481_DMIT_Report.pdf',
    size: '4.3 MB',
    generatedAt: '08 Jul 2026 · 05:32 PM',
    status: 'Ready',
    plan: 'Standard',
    details: {
      clientType: 'Individual',
      referredBy: 'MLA',
      name: 'Aarav Menon',
      age: '14',
      phone: '9812345670',
      gender: 'Male',
      mrp: '₹2,500',
    },
    cabAudios: [],
  },
  {
    id: 'r4',
    scanId: 'S42479',
    reportName: 'S42479_DMIT_Report.pdf',
    size: '—',
    generatedAt: '17 Jul 2026 · 10:05 AM',
    status: 'Processing',
    plan: 'Standard',
    details: {
      clientType: 'Individual',
      referredBy: 'SELF',
      name: 'Diya Prakash',
      age: '9',
      phone: '9900112233',
      gender: 'Female',
      mrp: '₹2,000',
    },
    cabAudios: [],
  },
];

export function formatDuration(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
