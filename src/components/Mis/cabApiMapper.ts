import type { CabStateApi } from '../../api/types';
import type { CabFeedback } from './cabData';

export function mapCabState(state: CabStateApi): { feedback: CabFeedback[]; companyBalance: string | null } {
  return {
    feedback: state.feedback.map((row) => ({
      id: row.id,
      scanCode: row.scan_code,
      clientName: row.client_name,
      menteeId: row.mentee_id,
      menteeName: row.mentee_name,
      menteeBilling: row.mentee_billing,
      mentorId: row.mentor_id,
      mentorName: row.mentor_name,
      mrp: row.mrp,
      rating: row.rating,
      comments: row.comments,
      status: row.status,
      creditAmount: row.credit_amount,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at ?? undefined,
    })),
    companyBalance: state.company_balance ?? null,
  };
}
