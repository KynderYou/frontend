import type { ReportRecordApi } from '../../api/types';
import type { CabAudio, ReportPlan, ReportRecord } from './reportTypes';

function mapDetails(details: ReportRecordApi['details']) {
  return {
    clientType: details.client_type,
    referredBy: details.referred_by,
    name: details.name,
    age: details.age,
    phone: details.phone,
    gender: details.gender,
    mrp: details.mrp,
  };
}

function mapCabAudios(audios: ReportRecordApi['cab_audios']): CabAudio[] {
  return audios.map((audio) => ({
    id: String(audio.id),
    title: audio.title,
    counsellor: audio.counsellor,
    durationSec: audio.duration_sec,
  }));
}

export function reportToRecord(report: ReportRecordApi): ReportRecord {
  return {
    id: String(report.id),
    numericId: report.id,
    scanId: report.scan_code,
    reportName: report.report_name,
    size: report.size,
    generatedAt: report.generated_at,
    status: report.status,
    plan: report.plan as ReportPlan,
    details: mapDetails(report.details),
    cabAudios: mapCabAudios(report.cab_audios),
    cabRequestedAt: report.cab_requested_at ?? undefined,
    reportFileUrl: report.report_file_url,
  };
}

export function reportListToRecords(reports: ReportRecordApi[]): ReportRecord[] {
  return reports.map(reportToRecord);
}

export function applyReportUpdate(records: ReportRecord[], updated: ReportRecordApi): ReportRecord[] {
  const mapped = reportToRecord(updated);
  return records.map((row) => (row.numericId === mapped.numericId ? mapped : row));
}
