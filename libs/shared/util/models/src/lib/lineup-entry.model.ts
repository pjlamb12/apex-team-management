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

export function getDefaultSlots(count: number, sportName?: string): number[] {
  if (sportName === 'Volleyball') return [0, 1, 2, 3, 4, 5];
  if (count === 11) return [0, 1, 2, 4, 5, 6, 7, 9, 10, 12, 14]; // GK, 4 DEF, 4 MID, 2 FWD
  if (count === 9) return [0, 2, 3, 4, 7, 8, 9, 12, 14]; // GK, 3 DEF, 3 MID, 2 FWD
  if (count === 7) return [0, 2, 4, 7, 8, 9, 13]; // GK, 2 DEF, 3 MID, 1 FWD
  if (count === 5) return [0, 2, 4, 8, 13]; // GK, 2 DEF, 1 MID, 1 FWD
  return Array.from({ length: count }, (_, i) => i);
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
  if ((slot >= 6 && slot <= 10) || (slot >= 16 && slot <= 21)) return 'MID';
  if (slot >= 11 && slot <= 15) return 'FWD';
  return 'UNKNOWN';
}

