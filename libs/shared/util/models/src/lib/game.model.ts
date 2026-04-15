// D-11: Pure TypeScript interface — no @Entity decorators
export interface Game {
  id: string;
  seasonId: string;
  opponent?: string;
  scheduledAt?: string;  // ISO datetime string
}
