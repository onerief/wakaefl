
export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  manager?: string;
  socialMediaUrl?: string;
  whatsappNumber?: string;
  isTopSeed?: boolean;
  assignedGroup?: string;
  ownerEmail?: string; // Link to registered user email
  requestedOwnerEmail?: string; // New: Email of user requesting to claim this team
}

export interface Standing {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
  standings: Standing[];
}

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface MatchComment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
  timestamp: number;
  isAdmin?: boolean;
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  summary?: string | null;
  group: string;
  proofUrl?: string;
  leg?: number;
  matchday?: number;
  comments?: MatchComment[]; // New: Chat/Comments specific to this match
}

export interface KnockoutMatch {
  id:string;
  round: keyof KnockoutStageRounds;
  matchNumber: number;
  teamA: Team | null;
  teamB: Team | null;
  scoreA1: number | null;
  scoreB1: number | null;
  scoreA2: number | null;
  scoreB2: number | null;
  winnerId: string | null;
  nextMatchId: string | null;
  placeholderA: string;
  placeholderB: string;
}

export interface KnockoutStageRounds {
  'Round of 16': KnockoutMatch[];
  'Quarter-finals': KnockoutMatch[];
  'Semi-finals': KnockoutMatch[];
  'Final': KnockoutMatch[];
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string | null;
}

export type TournamentMode = 'league' | 'wakacl' | 'two_leagues';

export interface TournamentState {
  teams: Team[];
  groups: Group[];
  matches: Match[];
  knockoutStage: KnockoutStageRounds | null;
  rules: string;
  banners: string[];
  partners: Partner[];
  mode: TournamentMode;
  isDoubleRoundRobin: boolean;
}

export type View = 'home' | 'league' | 'wakacl' | 'admin';
