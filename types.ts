
export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  squadPhotoUrl?: string;
  manager?: string;
  socialMediaUrl?: string;
  whatsappNumber?: string;
  isTopSeed?: boolean;
  assignedGroup?: string;
  ownerEmail?: string;
  requestedOwnerEmail?: string;
}

export interface PlayerStat {
    name: string;
    goals: number;
    assists: number;
}

export interface MatchPlayerStats {
    teamA: PlayerStat[];
    teamB: PlayerStat[];
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  date: number;
  category: string;
  author: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  buyUrl?: string; // Link ke marketplace (Shopee, Tokped, dll)
}

export interface Standing {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
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

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userTeamName?: string; // Added field for Team Name
  userPhoto?: string;
  timestamp: number;
  isAdmin?: boolean;
}

export interface Notification {
  id: string;
  email: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'success' | 'warning';
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
  comments?: MatchComment[];
  playerStats?: MatchPlayerStats;
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
  proofUrl?: string;
  comments?: MatchComment[];
  playerStats?: MatchPlayerStats;
}

export interface KnockoutStageRounds {
  'Play-offs': KnockoutMatch[];
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
export type TournamentStatus = 'active' | 'completed';

export interface SeasonHistory {
  seasonId: string;
  seasonName: string;
  champion: Team;
  runnerUp?: Team;
  dateCompleted: number;
  mode?: TournamentMode;
}

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
  status: TournamentStatus;
  history: SeasonHistory[];
  isRegistrationOpen: boolean;
  headerLogoUrl?: string;
  news?: NewsItem[];
  products?: Product[];
  newsCategories?: string[];
  shopCategories?: string[];
  marqueeMessages?: string[];
  visibleModes?: TournamentMode[];
}

export type View = 'home' | 'league' | 'wakacl' | 'two_leagues' | 'admin' | 'hall_of_fame' | 'news' | 'privacy' | 'about' | 'terms' | 'shop';
