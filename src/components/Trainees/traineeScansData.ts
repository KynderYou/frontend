/** Seed scans for mentor trainee drill-down — replace with API later. */

export type TraineeScanStatus = 'Saved' | 'Exported' | 'Processing' | 'Verified';

export type TraineeScan = {
  id: string;
  traineeId: string;
  scanId: string;
  clientName: string;
  gender: string;
  reportType: string;
  cost: string;
  uploadedAt: string;
  status: TraineeScanStatus;
};

export const traineeScans: TraineeScan[] = [
  {
    id: 'ts1',
    traineeId: 't1',
    scanId: 'S42701',
    clientName: 'Aarav Mehta',
    gender: 'Male',
    reportType: 'Student',
    cost: '2000.00',
    uploadedAt: '26 Jul 2026 · 10:12 AM',
    status: 'Exported',
  },
  {
    id: 'ts2',
    traineeId: 't1',
    scanId: 'S42702',
    clientName: 'Diya Kapoor',
    gender: 'Female',
    reportType: 'Career',
    cost: '2500.00',
    uploadedAt: '24 Jul 2026 · 03:40 PM',
    status: 'Processing',
  },
  {
    id: 'ts3',
    traineeId: 't1',
    scanId: 'S42703',
    clientName: 'Kabir Singh',
    gender: 'Male',
    reportType: 'Business',
    cost: '3000.00',
    uploadedAt: '20 Jul 2026 · 11:05 AM',
    status: 'Verified',
  },
  {
    id: 'ts4',
    traineeId: 't2',
    scanId: 'S42710',
    clientName: 'Isha Nair',
    gender: 'Female',
    reportType: 'Student',
    cost: '1500.00',
    uploadedAt: '25 Jul 2026 · 09:20 AM',
    status: 'Exported',
  },
  {
    id: 'ts5',
    traineeId: 't2',
    scanId: 'S42711',
    clientName: 'Rohan Das',
    gender: 'Male',
    reportType: 'Institution',
    cost: '2000.00',
    uploadedAt: '22 Jul 2026 · 02:15 PM',
    status: 'Saved',
  },
  {
    id: 'ts6',
    traineeId: 't3',
    scanId: 'S42720',
    clientName: 'Meera Iyer',
    gender: 'Female',
    reportType: 'Career',
    cost: '2500.00',
    uploadedAt: '10 Mar 2026 · 04:50 PM',
    status: 'Verified',
  },
  {
    id: 'ts7',
    traineeId: 't4',
    scanId: 'S42730',
    clientName: 'Nikhil Rao',
    gender: 'Male',
    reportType: 'Business',
    cost: '3000.00',
    uploadedAt: '18 Jul 2026 · 01:10 PM',
    status: 'Exported',
  },
  {
    id: 'ts8',
    traineeId: 't4',
    scanId: 'S42731',
    clientName: 'Sana Begum',
    gender: 'Female',
    reportType: 'Student',
    cost: '2000.00',
    uploadedAt: '15 Jul 2026 · 10:45 AM',
    status: 'Processing',
  },
  {
    id: 'ts9',
    traineeId: 't4',
    scanId: 'S42732',
    clientName: 'Vivaan Shah',
    gender: 'Male',
    reportType: 'Career',
    cost: '2500.00',
    uploadedAt: '12 Jul 2026 · 05:30 PM',
    status: 'Saved',
  },
  {
    id: 'ts10',
    traineeId: 't5',
    scanId: 'S42740',
    clientName: 'Ananya Krishnan',
    gender: 'Female',
    reportType: 'Student',
    cost: '1500.00',
    uploadedAt: '27 Jul 2026 · 08:55 AM',
    status: 'Exported',
  },
  {
    id: 'ts11',
    traineeId: 't5',
    scanId: 'S42741',
    clientName: 'Dev Patel',
    gender: 'Male',
    reportType: 'Institution',
    cost: '2000.00',
    uploadedAt: '21 Jul 2026 · 12:25 PM',
    status: 'Verified',
  },
];

/** Scans seeded for MLAs (reuses same shape) */
const mlaScans: TraineeScan[] = [
  { id: 'ms1', traineeId: 'm1', scanId: 'S50001', clientName: 'Aditi Rao', gender: 'Female', reportType: 'Career', cost: '2500.00', uploadedAt: '27 Jul 2026 · 11:00 AM', status: 'Exported' },
  { id: 'ms2', traineeId: 'm1', scanId: 'S50002', clientName: 'Karthik Rajan', gender: 'Male', reportType: 'Business', cost: '3000.00', uploadedAt: '25 Jul 2026 · 09:30 AM', status: 'Verified' },
  { id: 'ms3', traineeId: 'm2', scanId: 'S50010', clientName: 'Lakshmi Priya', gender: 'Female', reportType: 'Student', cost: '2000.00', uploadedAt: '26 Jul 2026 · 02:45 PM', status: 'Processing' },
  { id: 'ms4', traineeId: 'm2', scanId: 'S50011', clientName: 'Raj Kumar', gender: 'Male', reportType: 'Institution', cost: '2000.00', uploadedAt: '23 Jul 2026 · 10:15 AM', status: 'Exported' },
  { id: 'ms5', traineeId: 'm3', scanId: 'S50020', clientName: 'Shreya Das', gender: 'Female', reportType: 'Career', cost: '2500.00', uploadedAt: '24 Jul 2026 · 04:20 PM', status: 'Saved' },
  { id: 'ms6', traineeId: 'm4', scanId: 'S50030', clientName: 'Vikram Joshi', gender: 'Male', reportType: 'Business', cost: '3000.00', uploadedAt: '22 Jul 2026 · 01:00 PM', status: 'Verified' },
  { id: 'ms7', traineeId: 'm4', scanId: 'S50031', clientName: 'Pooja Menon', gender: 'Female', reportType: 'Student', cost: '1500.00', uploadedAt: '20 Jul 2026 · 03:30 PM', status: 'Exported' },
  { id: 'ms8', traineeId: 'm5', scanId: 'S50040', clientName: 'Arjun Nair', gender: 'Male', reportType: 'Career', cost: '2500.00', uploadedAt: '28 Jul 2026 · 09:00 AM', status: 'Processing' },
];

const allScans = [...traineeScans, ...mlaScans];

export function scansForTrainee(traineeId: string): TraineeScan[] {
  return allScans.filter((scan) => scan.traineeId === traineeId);
}
