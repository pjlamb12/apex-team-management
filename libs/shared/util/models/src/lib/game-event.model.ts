// D-11: Pure TypeScript interface — no @Entity decorators
export interface GameEvent {
  id: string;
  gameId: string;
  eventType: string;
  minuteOccurred?: number;
  payload: Record<string, unknown>;
}
