// D-11: Pure TypeScript interface — no @Entity decorators
import type { Season } from './season.model';

export interface Team {
  id: string;
  name: string;
  sportId: string;
  playersOnField: number;       // D-03: team-level setting (e.g. 11 for soccer)
  periodCount: number;          // D-03: team-level setting (e.g. 2 halves)
  periodLengthMinutes: number;  // D-03: team-level setting (e.g. 45 minutes)
  seasons?: Season[];
}
