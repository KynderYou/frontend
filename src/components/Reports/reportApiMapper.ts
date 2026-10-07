import type { ReportRecordApi } from '../../api/types';
import { normalizeReportPlan } from './reportPackages';
import type { ReportCabFeedback, ReportRecord } from './reportTypes';

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

function mapCabFeedback(feedback: ReportRecordApi['cab_feedback']): ReportCabFeedback | undefined {
  if (!feedback) return undefined;
  return {
    rating: feedback.rating,
    comments: feedback.comments,
    status: feedback.status,
    submittedAt: feedback.submitted_at,
  };
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
    plan: normalizeReportPlan(report.plan),
    details: mapDetails(report.details),
    cabFeedback: mapCabFeedback(report.cab_feedback),
    ownerId: report.owner_id,
    ownerName: report.owner_name,
    cabEligible: Boolean(report.cab_eligible),
    uploadedForTrainee: Boolean(report.uploaded_for_trainee),
    reportFileUrl: report.report_file_url,
    flaggedX: Boolean(report.flagged_x),
    cabRequestedAt: report.cab_requested_at ?? undefined,
  };
}

export function reportListToRecords(reports: ReportRecordApi[]): ReportRecord[] {
  return reports.map(reportToRecord);
}

export function applyReportUpdate(records: ReportRecord[], updated: ReportRecordApi): ReportRecord[] {
  const mapped = reportToRecord(updated);
  return records.map((row) => (row.numericId === mapped.numericId ? mapped : row));
}
