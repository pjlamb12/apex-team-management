export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DangerPlayer {
  id: string;
  jerseyNumber?: number | null;
  name?: string;
  position?: string;
  threatLevel: ThreatLevel;
  notes?: string;
  tags?: string[];
}

export interface OpponentScoutingNote {
  id: string;
  date: string;
  authorName?: string;
  content: string;
  tags?: string[];
}

export interface Opponent {
  id: string;
  teamId: string;
  name: string;
  coachName?: string | null;
  contactInfo?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  formation?: string | null;
  threatLevel?: ThreatLevel | null;
  notes?: string | null;
  tendencies?: string | null;
  dangerPlayers?: DangerPlayer[];
  scoutingNotes?: OpponentScoutingNote[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OpponentHeadToHeadStats {
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  winPercentage: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  cleanSheets: number;
  homeRecord: { wins: number; draws: number; losses: number; total: number };
  awayRecord: { wins: number; draws: number; losses: number; total: number };
  lastPlayedDate?: string | null;
}

export interface OpponentMatchHistoryItem {
  id: string;
  scheduledAt: string;
  isHomeGame: boolean;
  location?: string | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  result: 'win' | 'draw' | 'loss' | 'upcoming';
  status: 'scheduled' | 'in_progress' | 'completed';
  seasonName?: string;
  leagueName?: string;
  notes?: string | null;
  eventNotes?: { id: string; content: string; createdAt: string; authorName?: string }[];
  gameEventsSummary?: { goals: number; assists: number; yellowCards: number; redCards: number };
}

export interface OpponentWithStats extends Opponent {
  headToHead: OpponentHeadToHeadStats;
  recentMatches?: OpponentMatchHistoryItem[];
}
