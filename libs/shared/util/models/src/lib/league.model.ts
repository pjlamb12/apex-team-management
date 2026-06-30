export type LeagueType = 'league' | 'tournament' | 'session' | 'cup' | 'other';

export interface League {
  id: string;
  seasonId: string;
  name: string;
  type: LeagueType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  playersOnField?: number;
  periodCount?: number;
  periodLengthMinutes?: number;
  defaultHomeVenue?: string;
  defaultHomeColor?: string;
  defaultAwayColor?: string;
  homeLocationId?: string;
  bestOfSets?: number;
  setScoreGoal?: number;
  winByTwo?: boolean;
  pointCap?: number | null;
  decidingSetScoreGoal?: number;
  decidingSetPointCap?: number | null;
}

export interface LeagueStats {
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}
