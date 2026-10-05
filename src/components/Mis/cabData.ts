export type CabFeedbackStatus = 'Pending' | 'Approved' | 'Rejected';

export type CabFeedback = {
  id: number;
  scanCode: string;
  clientName: string;
  menteeId: number;
  menteeName: string;
  menteeBilling: string;
  mentorId: number | null;
  mentorName: string;
  mrp: string;
  rating: number;
  comments: string;
  status: CabFeedbackStatus;
  creditAmount: string;
  submittedAt: string;
  reviewedAt?: string;
};
