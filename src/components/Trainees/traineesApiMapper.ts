import type { TraineeScanApi, TraineesStateApi } from '../../api/types';
import type { Mentor, Trainee, TraineeScan, TraineeScanStatus } from './traineesData';

function mapScanStatus(status: string): TraineeScanStatus {
  if (status === 'Verified' || status === 'Exported' || status === 'Processing' || status === 'Saved') {
    return status;
  }
  return 'Saved';
}

export function mapTraineesState(state: TraineesStateApi): { mentors: Mentor[]; trainees: Trainee[] } {
  return {
    mentors: state.mentors.map((mentor) => ({
      id: String(mentor.id),
      name: mentor.name,
      email: mentor.email,
      role: mentor.role,
      region: mentor.region,
      traineeCount: mentor.trainee_count,
    })),
    trainees: state.trainees.map((trainee) => ({
      id: String(trainee.id),
      mentorId: String(trainee.mentor_id),
      name: trainee.name,
      email: trainee.email,
      doj: trainee.doj,
      billingPercent: trainee.billing_percent,
      scanCount: trainee.scan_count,
      doex: trainee.doex,
      status: trainee.status as Trainee['status'],
      role: trainee.role,
    })),
  };
}

export function mapTraineeScans(scans: TraineeScanApi[]): TraineeScan[] {
  return scans.map((scan) => ({
    id: String(scan.id),
    scanId: scan.scan_code,
    clientName: scan.client_name,
    gender: scan.gender,
    reportType: scan.report_type,
    cost: scan.cost,
    uploadedAt: scan.uploaded_at,
    status: mapScanStatus(scan.status),
  }));
}

export function traineeCountFor(mentorId: string, trainees: Trainee[]): number {
  return trainees.filter((trainee) => trainee.mentorId === mentorId).length;
}
