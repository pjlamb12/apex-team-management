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

export function getPositionFromSlot(slot: number, sportName?: string): string {
  if (sportName === 'Volleyball') {
    if (slot === 99) return 'Libero';
    const defaults = [
      'Opposite Hitter',
      'Outside Hitter',
      'Middle Blocker',
      'Opposite Hitter',
      'Outside Hitter',
      'Middle Blocker',
    ];
    return defaults[slot] || 'Outside Hitter';
  }
  if (slot === 0) return 'GK';
  if (slot >= 1 && slot <= 5) return 'DEF';
  if (slot >= 6 && slot <= 10) return 'MID';
  if (slot >= 11 && slot <= 15) return 'FWD';
  return 'UNKNOWN';
}
