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

export type NotificationItem = {
  id: number;
  kind: string;
  title: string;
  body: string;
  action_view: string | null;
  action_target: string | null;
  read: boolean;
  created_at: string;
  created_at_ms: number;
};

export type NotificationsState = {
  unread_count: number;
  items: NotificationItem[];
};

export type AdminTopUpRequest = {
  id: number;
  member_id: number;
  member_name: string;
  member_email: string;
  member_role: string;
  amount: string;
  submitted_at: string;
  proof_file_id: number | null;
};
