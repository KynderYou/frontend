/** UI types for My Trainees — data comes from `/api/trainees/*`. */

export type TraineeStatus = 'Active' | 'Inactive';

export type Trainee = {
  id: string;
  mentorId: string;
  name: string;
  email: string;
  doj: string;
  billingPercent: number;
  scanCount: number;
  doex: string;
  status: TraineeStatus;
  role: string;
};

export type Mentor = {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  traineeCount?: number;
};

export type TraineeScanStatus = 'Saved' | 'Exported' | 'Processing' | 'Verified';

export type TraineeScan = {
  id: string;
  scanId: string;
  clientName: string;
  gender: string;
  reportType: string;
  cost: string;
  uploadedAt: string;
  status: TraineeScanStatus;
};
