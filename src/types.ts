export interface Voter {
  id: number;
  name: string;
  cnic?: string;
  father_name?: string;
  gender?: 'Male' | 'Female' | 'Transgender';
  dob?: string;
  province?: string;
  district?: string;
  constituency?: string;
  polling_station?: string;
  electoral_block_code?: string;
  family_tree_no?: string;
  nadra_verified?: boolean;
  photo?: string;
  embedding?: number[];
  precinct?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  has_voted: boolean;
  enrolled_at: string;
  approved_at?: string | null;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  tagline: string;
  sign_name: string;
  sign_icon: string;
  sign_image_url?: string;
  photo_url: string;
  display_order: number;
  avatarColor?: string;
  base_votes?: number;
  // Optional candidate details (shown on results/profile cards, never on the ballot paper)
  education?: string;
  profession?: string;
  age?: number;
  hometown?: string;
  experience?: string;
}

export interface PublicCandidateResult {
  id: string;
  name: string;
  party: string;
  tagline: string;
  sign_name: string;
  sign_icon: string;
  sign_image_url?: string;
  photo_url: string;
  display_order: number;
  votes: number;
  percentage: number;
  isLeading: boolean;
  education?: string;
  profession?: string;
  age?: number;
  hometown?: string;
  experience?: string;
}

export interface PublicElectionResults {
  title: string;
  subtitle: string;
  constituency: string;
  pollingStation: string;
  totalVotesCast: number;
  totalRegistered: number;
  turnoutPercentage: number;
  candidates: PublicCandidateResult[];
  lastUpdated: string;
}

export interface ElectionConfig {
  title: string;
  subtitle: string;
  isBallotLocked: boolean;
  autoApprove: boolean;
  adminPin?: string; // never sent by the server anymore; kept optional for legacy shapes
  threshold?: number;
}

export interface BallotStats {
  totalEnrolled: number;
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalVoted: number;
  turnoutPercentage: number;
  ballotsByChoice: { choice: string; count: number }[];
  votersList: Voter[];
  threshold: number;
  config: ElectionConfig;
  candidates: Candidate[];
}

export type CheckInStatus =
  | 'idle'
  | 'position_face'
  | 'checking_liveness'
  | 'matching'
  | 'match_found'
  | 'pending_approval'
  | 'registration_rejected'
  | 'already_voted'
  | 'not_registered'
  | 'vote_recorded'
  | 'liveness_failed';

export interface MatchResult {
  match: boolean;
  voter?: Voter;
  similarity?: number;
  threshold?: number;
  reason?: string;
  ballotToken?: string;
}
