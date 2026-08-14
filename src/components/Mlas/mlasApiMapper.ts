import type { MlaScanApi, MlasStateApi } from '../../api/types';
import type { Mentor } from '../Trainees/traineesData';
import type { Mla, MlaScan, MlaScanStatus } from './mlasData';

function mapScanStatus(status: string): MlaScanStatus {
  if (status === 'Verified' || status === 'Exported' || status === 'Processing' || status === 'Saved') {
    return status;
  }
  return 'Saved';
}

export function mapMlasState(state: MlasStateApi): { mentors: Mentor[]; mlas: Mla[] } {
  return {
    mentors: state.mentors.map((mentor) => ({
      id: String(mentor.id),
      name: mentor.name,
      email: mentor.email,
      role: mentor.role,
      region: mentor.region,
      traineeCount: mentor.mla_count,
    })),
    mlas: state.mlas.map((mla) => ({
      id: String(mla.id),
      mentorId: String(mla.mentor_id),
      name: mla.name,
      email: mla.email,
      doj: mla.doj,
      billingPercent: mla.billing_percent,
      scanCount: mla.scan_count,
      doex: mla.doex,
      status: mla.status as Mla['status'],
      role: mla.role,
    })),
  };
}

export function mapMlaScans(scans: MlaScanApi[]): MlaScan[] {
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

export function mlaCountFor(mentorId: string, mlas: Mla[]): number {
  return mlas.filter((mla) => mla.mentorId === mentorId).length;
}
