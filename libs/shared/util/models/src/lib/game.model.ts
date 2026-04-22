// D-11: Pure TypeScript interface — no @Entity decorators
export interface Game {
  id: string;
  seasonId: string;
  opponent?: string;
  location?: string;
  scheduledAt?: string;  // ISO datetime string
  isHomeGame: boolean;
  uniformColor?: string;
  periodCount?: number;
  periodLengthMinutes?: number;
  currentPeriod?: number;
  status?: 'scheduled' | 'in_progress' | 'completed';
  goalsFor?: number;
  goalsAgainst?: number;
}
