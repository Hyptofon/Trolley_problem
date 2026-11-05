export type Choice = 'stay' | 'switch';

export interface VoteRequest {
  participantId: string;
  choice: Choice;
}

export type VoteStatus = 'recorded' | 'already_voted';

export interface VoteResponse {
  status: VoteStatus;
  choice: Choice;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface AdminLoginRequest {
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
}

export interface AdminSessionResponse {
  authenticated: boolean;
}

export interface AdminStatsResponse {
  total: number;
  stay: number;
  switch: number;
  stayPercent: number;
  switchPercent: number;
  updatedAt: string;
}

export type VoteSubmissionState =
  | 'idle'
  | 'submitting'
  | 'recorded'
  | 'already_voted'
  | 'error';

export interface StoredVote {
  participantId: string;
  choice: Choice;
  status: VoteStatus;
  timestamp: string;
}

