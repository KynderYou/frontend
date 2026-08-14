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
export type Member = {
  mid: number;
  mail_id: string;
  role: string;
  status: string;
  name: string;
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
  created_at: string;
  reply_count: number;
  seen_count: number;
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
  notices: DashboardNotice[];
  top_performers: TopPerformer[];
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
};

export type HoScanActionPayload = {
  action: string;
  main_pattern?: string;
  sub_pattern?: string;
  finger?: string;
  urc?: number;
  rrc?: number;
  lfo?: number;
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
  created_at: string;
  created_at_ms: number;
  audience_mode: string;
  recipient_ids: number[];
  group_ids: number[];
  group_names: string[];
  seen_count: number;
  viewers: { id: string; name: string; initials: string; role: string; seen_at: string }[];
  poll: CommPollApi | null;
  replies: CommReplyApi[];
};

export type CommunicationsStateApi = {
  groups: CommGroupApi[];
  communications: CommunicationApi[];
  members: CommMemberApi[];
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

export type CabAudioApi = {
  id: number;
  title: string;
  counsellor: string;
  duration_sec: number;
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
  cab_audios: CabAudioApi[];
  cab_requested_at: string | null;
  report_file_url: string | null;
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
  name: string;
  email: string;
  doj: string;
  billing_percent: number;
  scan_count: number;
  doex: string;
  status: string;
  role: string;
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
  doex: string;
  status: string;
  role: string;
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
};

export type LedgerData = {
  kpis: LedgerKpis;
  receipts: LedgerEntryRow[];
  billing: LedgerEntryRow[];
  expenses_by_month: LedgerMonthBar[];
  billing_window_days: number;
  expenses_year: number;
};

export type CabDebitAudioApi = {
  id: number;
  title: string;
  file_name: string;
  duration_sec: number;
};

export type CabDebitApi = {
  id: number;
  scan_id: string;
  client_name: string;
  mentor_id: number;
  mentor_name: string;
  mentee_id: number;
  mentee_name: string;
  audio: CabDebitAudioApi;
  debit_amount: string;
  status: string;
  debited_at: string | null;
};

export type CabStateApi = {
  mentors: MentorApi[];
  records: CabDebitApi[];
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

export type MisNetworkStateApi = {
  year: number;
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
};

export type AdminMembersStateApi = {
  members: AdminMemberApi[];
};

export type CreateAdminMemberPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
};

export type AdminActionApi = {
  message: string;
  members: AdminMemberApi[];
};
