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
  review_rewards?: boolean;
  rights_master?: boolean;
  status_master?: boolean;
  mis_cab: boolean;
  scans_mla: boolean;
  scans_ho: boolean;
  dashboard?: boolean;
  ledger?: boolean;
  mis?: boolean;
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
  branding?: string;
  mla_type?: string;
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

export type LoginGate = {
  code: string;
  message: string;
  blocking: boolean;
  action?: string | null;
  amount?: number | null;
  count?: number | null;
  redirect_view?: string | null;
};

export type LoginResponse = {
  token: string;
  member: Member;
  gates?: LoginGate[];
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
  /** Trainee who uploaded on the mentor's behalf */
  uploaded_by?: string | null;
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
  phone?: string;
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
  upgraded_to_plan?: string | null;
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

export type RecycleBinScan = HoScan & {
  client_type: string;
  referred_by: string;
  billed_at: string | null;
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
  reason?: string;
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
  cab_request_audio_url?: string | null;
  billing_percent?: number;
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

export type NetworkAdminApi = {
  id: number;
  name: string;
  email: string;
  role: string;
  scan_count: number;
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
  admin_id?: number | null;
  admin_name?: string | null;
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
  billing_window_days: number;
  company_wide?: boolean;
  available_balance?: number;
  available_balance_display?: string;
  company_entries?: CompanyLedgerEntryApi[];
  super_admin?: boolean;
  admins?: { id: number; name: string; role: string }[];
  admin_filter_id?: number | null;
  people?: { id: number; name: string; role: string }[];
  viewing_member_id?: number | null;
  viewing_name?: string | null;
  viewing_role?: string | null;
};

export type CompanyLedgerEntryApi = {
  id: number;
  kind: 'opening' | 'funds' | 'cab_payout' | 'report_billing' | 'manual_receipt' | 'manual_expense' | 'topup' | string;
  title: string;
  date: string;
  amount: string;
  is_credit: boolean;
  created_by?: string | null;
  admin?: string | null;
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
  reviews_by_month: MisMonthPointApi[];
  billing_by_month: MisMonthPointApi[];
  /** Scans per day: 12 lists (Jan–Dec), each as long as that month. */
  scans_by_day?: number[][];
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
  archived_at?: string;
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
  mla_type?: string;
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
  admin_by_id?: number | null;
  remarks?: string;
  certified?: boolean;
  competency_expiry?: string | null;
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
  mla_type?: string;
};

export type AdminVisibilityFieldsPayload = {
  mrp?: 'Show' | 'Hide';
  branding?: string;
  mis_training?: string;
  admin_by_id?: number;
  remarks?: string;
  certified?: boolean;
  competency_expiry?: string | null;
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
  reward_amount?: number | null;
  rewarded_by_name?: string;
  rewarded_at?: string;
  can_reward?: boolean;
};

export type ReviewDuplicateCheckApi = {
  duplicate: boolean;
  field: 'link' | 'file' | null;
  message: string;
};

export type ReviewRewardAmount = 50 | 100 | 150;

export type ReviewRewardMemberApi = {
  member_id: number;
  name: string;
  role: string;
  reviews: number;
  total: number;
};

export type ReviewRewardEntryApi = {
  review_id: number;
  kind_label: string;
  client_name: string;
  link: string | null;
  posted_by_id: number;
  posted_by_name: string;
  posted_by_role: string;
  posted_at: string;
  amount: number;
  rewarded_by_name: string;
  rewarded_at: string;
};

export type ReviewRewardsApi = {
  year: number;
  total: number;
  members: ReviewRewardMemberApi[];
  entries: ReviewRewardEntryApi[];
};

export type RightsMaster = {
  id: number;
  name: string;
  subscription_amount: number;
  billing_percent: number;
  cws_reports: string;
  mrp_display: string;
  lys_billing: string;
  plus_reports: string;
  dnai_reports: string;
  nat_discount: number | null;
  sort_order: number;
  active: boolean;
};

export type RightsMasterInput = {
  name: string;
  subscription_amount: number;
  billing_percent: number;
  cws_reports: 'na' | 'yes';
  mrp_display: 'must' | 'optional';
  lys_billing: 'na' | 'yes';
  plus_reports: 'upgrade' | 'direct';
  dnai_reports: 'na' | 'conditional' | 'yes';
  nat_discount: number | null;
  sort_order: number;
  active: boolean;
};

export type RightsMasterList = {
  items: RightsMaster[];
};

export type StatusMaster = {
  id: number;
  name: string;
  rank: number;
  dds_adult: string;
  dds_basic: string;
  dds_plus: string;
  min_lys: string;
  max_billing: number | null;
  renewal: string;
  nat_billing: number | null;
  sort_order: number;
  active: boolean;
};

export type StatusMasterInput = {
  name: string;
  rank: number;
  dds_adult: 'na' | 'must' | 'optional';
  dds_basic: 'na' | 'must' | 'optional';
  dds_plus: 'na' | 'must' | 'optional';
  min_lys: 'na' | 'upto_25' | '25_49' | '50_99' | '100_plus';
  max_billing: number | null;
  renewal: 'na' | 'optional' | 'must';
  nat_billing: number | null;
  sort_order: number;
  active: boolean;
};

export type StatusMasterList = {
  items: StatusMaster[];
};
