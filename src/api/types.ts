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
