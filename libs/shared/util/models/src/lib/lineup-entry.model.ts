import { Player } from './player.model';

export interface LineupEntry {
  id: string;
  gameId: string;
  playerId: string;
  player: Player;
  positionName: string | null;
  slotIndex: number | null;
  status: 'starting' | 'bench';
}
