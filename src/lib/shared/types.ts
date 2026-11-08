export type Choice = 'stay' | 'switch';

export type VoteStatus = 'recorded' | 'updated' | 'already_voted';

export interface VoteRequest {
  participantId: string;
  choice: Choice;
}

export interface VoteResponse {
  status: VoteStatus;
  choice: Choice;
  previousChoice?: Choice | null;
}

export interface VoteStatusRequest {
  participantId: string;
}

export interface VoteStatusResponse {
  voted: boolean;
  choice?: Choice;
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
  | 'updated'
  | 'already_voted'
  | 'error';

export interface StoredVote {
  participantId: string;
  choice: Choice;
  status: VoteStatus;
  timestamp: string;
}

export type ExperimentPhase =
  | 'idle'
  | 'intro-animation'
  | 'decision-pause'
  | 'switching'
  | 'outcome-animation'
  | 'result';

export interface EthicalExplanation {
  choice: Choice;
  frameworkName: string;
  corePrinciple: string;
  detailedAnalysis: string;
  omissionBiasExplanation: string;
  quote: string;
}
