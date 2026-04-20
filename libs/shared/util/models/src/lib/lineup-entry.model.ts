export interface LineupEntry {
  id: string;
  gameId: string;
  playerId: string;
  positionName: string | null;
  slotIndex: number | null;
  status: 'starting' | 'bench';
}
