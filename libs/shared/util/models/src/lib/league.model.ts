export type LeagueType = 'league' | 'tournament' | 'session' | 'cup' | 'other';

export interface League {
  id: string;
  seasonId: string;
  name: string;
  type: LeagueType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeagueStats {
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}
