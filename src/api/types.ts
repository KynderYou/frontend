export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal;
  /** Override the default timeout from env config */
  timeoutMs?: number;
};

export type HealthResponse = {
  status: string;
  service: string;
};

export type HelloResponse = {
  message: string;
};

/** Slim identity from login /auth/me */
export type MemberNav = {
  ho_trainees: boolean;
  ho_mlas: boolean;
  mentor_trainees: boolean;
  mentor_mlas: boolean;
  admin_members: boolean;
  admin_topups: boolean;
  mis_cab: boolean;
  scans_mla: boolean;
  scans_ho: boolean;
};

export type Member = {
  mid: number;
  mail_id: string;
  role: string;
  status: string;
  name: string;
  nav: MemberNav;
  mentee_type?: string | null;
  avatar_url?: string | null;
};

/** Full profile from /profile/me */
export type MemberProfile = {
  mid: number;
  mail_id: string;
  role: string;
  status: string;
  name: string;
  mobile_1: string;
  mobile_2: string;
  dob: string | null;
  country: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  doj: string | null;
  mas_type: string;
  expiry_date: string | null;
  billing: string;
  op_bal: number | null;
  uid: string;
  services: string;
  availability: string;
  certified: boolean;
  cr_date: string | null;
  mrp: string;
  branding: string;
  mis_training: string;
  mentored_by: string;
  admin_by: string;
  remarks: string;
  avatar_url: string | null;
};

export type ProfileUpdatePayload = {
  name?: string;
  mail_id?: string;
  mobile_1?: string;
  mobile_2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  uid?: string;
  services?: string;
  availability?: string;
};

export type Certification = {
  id: number;
  file_name: string;
  url: string;
  created_at: string;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  member: Member;
};

export type MessageResponse = {
  message: string;
};

export type DashboardKpis = {
  scans_this_year: number;
  scans_total: number;
  billing_this_year: number | null;
  billing_total: number | null;
};

export type DashboardNotice = {
  id: number;
  title: string;
  body: string;
  severity: 'high' | 'medium' | 'low';
  author_name: string;
  author_initials: string;
  author_role?: string | null;
  created_at: string;
  reply_count: number;
  seen_count: number;
  read_by_me: boolean;
  viewer_names: string[];
  has_poll: boolean;
};

export type TopPerformer = {
  rank: number;
  member_id: number;
  name: string;
  region: string;
  scan_count: number;
};

export type DashboardData = {
  kpis: DashboardKpis;
  /** Admin / H.O see totals across the whole company. */
  company_wide?: boolean;
};

export type MlaScanDetails = {
  client_type: string;
  referred_by: string;
  name: string;
  age: string;
  phone: string;
  gender: string;
  mrp: string;
};

export type MlaScanImage = {
  name: string;
  label: string;
  url: string;
};

export type MlaScan = {
  id: number;
  scan_code: string;
  file_name: string;
  file_url: string | null;
  size: string;
  uploaded_at: string;
  exported_at: string | null;
  status: string;
  details: MlaScanDetails;
  details_saved: boolean;
  exported: boolean;
  images: MlaScanImage[];
};

export type MlaScanUpdatePayload = {
  client_type?: string;
  referred_by?: string;
  name?: string;
  age?: string;
  phone?: string;
  gender?: string;
  mrp?: string;
};

export type HoScan = {
  id: number;
  section: string;
  scan_code: string;
  name: string;
  gender: string;
  age: string;
  scan_by: string;
  report_type: string;
  cost: string;
  images: number;
  processed_by: string;
  preprocessed_by: string | null;
  main_pattern: string | null;
  sub_pattern: string | null;
  urc: number | null;
  rrc: number | null;
  lfo: number | null;
  finger: string | null;
  status: string;
  flagged_x: boolean;
  billing_percent?: number | null;
  report_debit_amount?: string | null;
  report_billed?: boolean;
  has_report_file?: boolean;
};

export type ScanFinger = {
  finger: string;
  main_pattern: string;
  sub_pattern: string;
  urc: number;
  rrc: number;
  lfo: number;
};

export type HoScanDetail = HoScan & {
  scan_images: MlaScanImage[];
  fingers?: ScanFinger[];
};

export type HoScanActionPayload = {
  action: string;
  expected_section?: string;
  main_pattern?: string;
  sub_pattern?: string;
  finger?: string;
  urc?: number;
  rrc?: number;
  lfo?: number;
  fingers?: ScanFinger[];
};

export type CommMemberApi = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type CommGroupApi = {
  id: number;
  name: string;
  member_ids: number[];
};

export type CommReplyApi = {
  id: number;
  author: string;
  author_initials: string;
  body: string;
  created_at: string;
  created_at_ms: number;
};

export type CommPollOptionApi = {
  id: number;
  label: string;
  votes: number;
};

export type CommPollApi = {
  question: string;
  options: CommPollOptionApi[];
};

export type CommunicationApi = {
  id: number;
  title: string;
  body: string;
  severity: string;
  author: string;
  author_initials: string;
  author_role?: string | null;
  created_at: string;
  created_at_ms: number;
  audience_mode: string;
  recipient_ids: number[];
  group_ids: number[];
  group_names: string[];
  seen_count: number;
  read_by_me?: boolean;
  viewers: { id: string; name: string; initials: string; role: string; seen_at: string }[];
  poll: CommPollApi | null;
  replies: CommReplyApi[];
};

export type PollVoteResultApi = {
  message_id: number;
  poll: CommPollApi;
};

export type DeleteCommGroupResponse = {
  message: string;
};

export type PublishCommunicationPayload = {
  title: string;
  body: string;
  severity: string;
  audience_mode: string;
  recipient_ids: number[];
  group_ids: number[];
  poll_question?: string | null;
  poll_options: string[];
  cab_scan_id?: string | null;
};

export type ReportDetailsApi = {
  client_type: string;
  referred_by: string;
  name: string;
  age: string;
  phone: string;
  gender: string;
  mrp: string;
};

export type ReportCabFeedbackApi = {
  rating: number;
  comments: string;
  audio_url?: string | null;
  status: CabFeedbackStatus;
  submitted_at: string;
};

export type ReportRecordApi = {
  id: number;
  scan_code: string;
  report_name: string;
  size: string;
  generated_at: string;
  status: string;
  plan: string;
  details: ReportDetailsApi;
  cab_feedback?: ReportCabFeedbackApi | null;
  owner_id: number;
  owner_name?: string;
  cab_eligible?: boolean;
  uploaded_for_trainee?: boolean;
  report_file_url: string | null;
  flagged_x?: boolean;
  cab_requested_at?: string | null;
};

export type MentorApi = {
  id: number;
  name: string;
  email: string;
  role: string;
  region: string;
  trainee_count: number;
};

export type TraineeApi = {
  id: number;
  mentor_id: number;
  mentor_name?: string;
  name: string;
  email: string;
  phone?: string;
  doj: string;
  doj_iso?: string | null;
  billing_percent: number;
  subscription?: string;
  scan_count: number;
  last_scan?: string;
  last_scan_days?: number | null;
  doex: string;
  expiry_iso?: string | null;
  remarks?: string;
  status: string;
  role: string;
  created_at?: string;
};

export type TraineePayload = {
  name: string;
  mentor_id: number;
  phone: string;
  email?: string;
  doj?: string;
  expiry_date?: string;
  subscription: string;
  billing_percent: number;
  remarks?: string;
  status: 'Active' | 'Inactive';
};

export type TraineesStateApi = {
  mentors: MentorApi[];
  trainees: TraineeApi[];
};

export type TraineeScanApi = {
  id: number;
  scan_code: string;
  client_name: string;
  gender: string;
  report_type: string;
  cost: string;
  uploaded_at: string;
  status: string;
};

export type MlaMentorApi = {
  id: number;
  name: string;
  email: string;
  role: string;
  region: string;
  mla_count: number;
};

export type MlaApi = {
  id: number;
  mentor_id: number;
  name: string;
  email: string;
  doj: string;
  billing_percent: number;
  scan_count: number;
  last_scan?: string;
  last_scan_days?: number | null;
  doex: string;
  status: string;
  role: string;
};

export type MentorRowApi = {
  id: number;
  name: string;
  email: string;
  doj: string;
  billing_percent: number;
  scan_count: number;
  last_scan: string;
  last_scan_days: number | null;
  doex: string;
  status: string;
  trainee_count: number;
  mla_count: number;
};

export type MlasStateApi = {
  mentors: MlaMentorApi[];
  mlas: MlaApi[];
};

export type MlaScanApi = {
  id: number;
  scan_code: string;
  client_name: string;
  gender: string;
  report_type: string;
  cost: string;
  uploaded_at: string;
  status: string;
};

export type LedgerEntryRow = {
  id: number;
  title: string;
  date: string;
  amount: string;
  amount_value: number;
  initials: string;
  pastel: string;
  kind?: string;
  is_credit?: boolean;
};

export type LedgerMonthBar = {
  month: number;
  label: string;
  value: number;
};

export type LedgerKpis = {
  total_receipts: number;
  billing_last_30_days: number;
  receipts_display: string;
  billing_display: string;
  total_topups?: number;
  topups_display?: string;
  topup_balance?: number;
  topup_balance_display?: string;
};

export type LedgerData = {
  kpis: LedgerKpis;
  receipts: LedgerEntryRow[];
  topups?: LedgerEntryRow[];
  billing: LedgerEntryRow[];
  expenses_by_month: LedgerMonthBar[];
  billing_window_days: number;
  expenses_year: number;
  company_wide?: boolean;
  available_balance?: number;
  available_balance_display?: string;
  company_entries?: CompanyLedgerEntryApi[];
};

export type CompanyLedgerEntryApi = {
  id: number;
  kind: 'opening' | 'funds' | 'cab_payout' | 'report_billing' | 'manual_receipt' | 'manual_expense' | 'topup' | string;
  title: string;
  date: string;
  amount: string;
  is_credit: boolean;
  created_by?: string | null;
};

export type CabFeedbackStatus = 'Pending' | 'Approved' | 'Rejected';

export type CabFeedbackApi = {
  id: number;
  scan_code: string;
  client_name: string;
  mentee_id: number;
  mentee_name: string;
  mentee_billing: string;
  mentor_id: number | null;
  mentor_name: string;
  mrp: string;
  rating: number;
  comments: string;
  audio_url?: string | null;
  status: CabFeedbackStatus;
  credit_amount: string;
  submitted_at: string;
  reviewed_at?: string | null;
};

export type CabStateApi = {
  feedback: CabFeedbackApi[];
  company_balance?: string | null;
};

export type MisContributorApi = {
  id: number;
  name: string;
  value: number;
};

export type MisMonthPointApi = {
  month: number;
  label: string;
  value: number;
  contributors: MisContributorApi[];
};

export type MisPerformanceRowApi = {
  id: number;
  name: string;
  region: string;
  scans_quarter: number;
  scans_year: number;
  reviews: number;
  billing: number;
};

export type NetworkScope = 'network' | 'team' | 'self';

export type MisNetworkStateApi = {
  year: number;
  scope?: NetworkScope;
  months_so_far: number;
  default_month: number;
  last_quarter_label: string;
  low_performer_threshold: number;
  year_totals: { scans: number; reviews: number; billing: number };
  scans_by_month: MisMonthPointApi[];
  reviews_by_month: MisMonthPointApi[];
  billing_by_month: MisMonthPointApi[];
  performance_rows: MisPerformanceRowApi[];
  low_performers: MisPerformanceRowApi[];
};

export type MisMlaOptionApi = {
  id: number;
  name: string;
  region: string;
};

export type MisScanRowApi = {
  scan_id: string;
  client_name: string;
  mla_id: number;
  mla_name: string;
  year: number;
  month: number;
  uploaded_at: string;
};

export type MisScansPageApi = {
  year: number;
  total: number;
  page: number;
  page_size: number;
  rows: MisScanRowApi[];
  mla_options: MisMlaOptionApi[];
};

export type AdminMemberApi = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  status: string;
  mentee_type?: string;
  doj?: string | null;
  mas_type?: string;
  expiry_date?: string | null;
  billing?: string;
  op_bal?: number | null;
  mentored_by_id?: number | null;
  mentored_by?: string;
  mrp?: string;
  branding?: string;
  mis_training?: string;
  admin_by?: string;
  remarks?: string;
  certified?: boolean;
};

export type AdminMembersStateApi = {
  members: AdminMemberApi[];
};


export type AdminMentorApi = {
  id: number;
  name: string;
  role: string;
};

export type AdminMentorsApi = {
  mentors: AdminMentorApi[];
};

export type AdminMembershipFieldsPayload = {
  mentored_by_id?: number;
  mas_type?: string;
  expiry_date?: string;
  billing?: string;
  op_bal?: number;
  doj?: string;
  role?: string;
};

export type AdminVisibilityFieldsPayload = {
  mrp?: 'Show' | 'Hide';
  branding?: string;
  mis_training?: string;
  admin_by?: string;
  remarks?: string;
  certified?: boolean;
};

export type CreateAdminMemberPayload = AdminMembershipFieldsPayload &
  AdminVisibilityFieldsPayload & {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  };

export type CreateAdminMemberResultApi = {
  message: string;
  member: AdminMemberApi;
};

export type UpdateAdminMemberStatusResultApi = {
  message: string;
  member: AdminMemberApi;
};

export type ResetAdminMemberPasswordResultApi = {
  message: string;
  id: number;
  temp_password: string;
};

export type DeleteAdminMemberResultApi = {
  message: string;
  id: number;
};

export type UpdateAdminMembershipResultApi = {
  message: string;
  member: AdminMemberApi;
};

export type UpdateAdminVisibilityResultApi = {
  message: string;
  member: AdminMemberApi;
};

export type ReviewKind = 'google' | 'instagram' | 'audio' | 'other';

export type ReviewApi = {
  id: number;
  kind: ReviewKind;
  kind_label: string;
  platform: string;
  link: string | null;
  file_url: string | null;
  file_mime: string | null;
  client_name: string;
  caption: string;
  posted_by_id: number;
  posted_by_name: string;
  posted_by_role: string;
  posted_at: string;
  can_delete: boolean;
};
