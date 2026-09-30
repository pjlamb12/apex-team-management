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

export interface FormationPreset {
  name: string;
  slots: number[];
  fieldCount: number;
}

export const SOCCER_FORMATIONS: Record<number, FormationPreset[]> = {
  9: [
    { name: '3-4-1', slots: [0, 2, 3, 4, 7, 9, 13, 18, 21], fieldCount: 9 },
    { name: '3-3-2', slots: [0, 2, 3, 4, 7, 8, 9, 12, 14], fieldCount: 9 },
    { name: '3-2-2-1', slots: [0, 2, 3, 4, 16, 17, 19, 20, 13], fieldCount: 9 },
    { name: '2-4-2', slots: [0, 2, 4, 7, 9, 12, 14, 18, 21], fieldCount: 9 },
    { name: '3-2-3', slots: [0, 2, 3, 4, 7, 9, 11, 13, 15], fieldCount: 9 },
  ],
  11: [
    { name: '4-4-2', slots: [0, 1, 2, 4, 5, 6, 7, 9, 10, 12, 14], fieldCount: 11 },
    { name: '4-3-3', slots: [0, 1, 2, 4, 5, 7, 8, 9, 11, 13, 15], fieldCount: 11 },
    { name: '4-2-3-1', slots: [0, 1, 2, 4, 5, 16, 17, 19, 20, 21, 13], fieldCount: 11 },
    { name: '3-5-2', slots: [0, 2, 3, 4, 6, 7, 8, 9, 10, 12, 14], fieldCount: 11 },
    { name: '3-4-3', slots: [0, 2, 3, 4, 7, 9, 18, 21, 11, 13, 15], fieldCount: 11 },
  ],
  7: [
    { name: '2-3-1', slots: [0, 2, 4, 7, 8, 9, 13], fieldCount: 7 },
    { name: '3-2-1', slots: [0, 2, 3, 4, 7, 9, 13], fieldCount: 7 },
    { name: '2-2-2', slots: [0, 2, 4, 7, 9, 12, 14], fieldCount: 7 },
  ],
  5: [
    { name: '2-1-1', slots: [0, 2, 4, 8, 13], fieldCount: 5 },
    { name: '1-2-1', slots: [0, 3, 7, 9, 13], fieldCount: 5 },
  ],
};

export function getDefaultSlots(count: number, sportName?: string): number[] {
  if (sportName === 'Volleyball') return [0, 1, 2, 3, 4, 5];
  const presets = SOCCER_FORMATIONS[count];
  if (presets && presets.length > 0) {
    return [...presets[0].slots];
  }
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

