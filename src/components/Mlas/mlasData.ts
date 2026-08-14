/** UI types for My MLAs — data comes from `/api/mlas/*`. */

import type { Mentor } from '../Trainees/traineesData';

export type { Mentor };

export type MlaStatus = 'Active' | 'Inactive';

export type Mla = {
  id: string;
  mentorId: string;
  name: string;
  email: string;
  doj: string;
  billingPercent: number;
  scanCount: number;
  doex: string;
  status: MlaStatus;
  role: string;
};

export type MlaScanStatus = 'Saved' | 'Exported' | 'Processing' | 'Verified';

export type MlaScan = {
  id: string;
  scanId: string;
  clientName: string;
  gender: string;
  reportType: string;
  cost: string;
  uploadedAt: string;
  status: MlaScanStatus;
};
