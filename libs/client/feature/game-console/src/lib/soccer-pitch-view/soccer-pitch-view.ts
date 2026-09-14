import { Component, input, output, computed, inject } from '@angular/core';
import { Player, StagedSub, LineupEntry, getPositionFromSlot } from '@apex-team/shared/util/models';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { PlaytimeService } from '../rotation-engine/playtime.service';

export interface PositionedPlayer extends Player {
  x: number;
  y: number;
  slotIndex?: number;
  isStaged?: boolean;
}

export interface FormationSlot {
  slotIndex: number;
  positionName?: string | null;
  playerId?: string | null;
}

@Component({
  selector: 'app-soccer-pitch-view',
  imports: [IonIcon],
  templateUrl: './soccer-pitch-view.html',
  styleUrls: ['./soccer-pitch-view.scss'],
})
export class SoccerPitchViewComponent {
  protected playtimeService = inject(PlaytimeService);

  players = input.required<Player[]>();
  initialLineup = input<LineupEntry[]>([]);
  stagedSubs = input<StagedSub[]>([]);
  playersOnField = input<number>(11);
  selectedPlayerId = input<string | null>(null);
  playerCardCounts = input<Record<string, { yellow: number; red: boolean }>>({});
  formationSlots = input<FormationSlot[]>([]);
  selectedSlotIndex = input<number | null>(null);
  showPlaytime = input<boolean>(true);
  playerSelected = output<{ player: Player; event: Event }>();
  emptySlotSelected = output<number>();
  backgroundClicked = output<void>();

  constructor() {
    addIcons({ addOutline });
  }

  protected slotCoordinates = computed(() => {
    return {
      0: { x: 50, y: 91 }, // GK
      
      // Defenders (1-5)
      1: { x: 15, y: 74 },
      2: { x: 32.5, y: 74 },
      3: { x: 50, y: 74 },
      4: { x: 67.5, y: 74 },
      5: { x: 85, y: 74 },

      // Midfielders (6-10)
      6: { x: 15, y: 44 },
      7: { x: 32.5, y: 44 },
      8: { x: 50, y: 44 },
      9: { x: 67.5, y: 44 },
      10: { x: 85, y: 44 },

      // Forwards (11-15)
      11: { x: 15, y: 13 },
      12: { x: 32.5, y: 13 },
      13: { x: 50, y: 13 },
      14: { x: 67.5, y: 13 },
      15: { x: 85, y: 13 },

      // Defensive Midfielders / CDMs (16-18)
      16: { x: 35, y: 59 },
      17: { x: 65, y: 59 },
      18: { x: 50, y: 59 },

      // Attacking Midfielders / CAMs (19-21)
      19: { x: 35, y: 28 },
      20: { x: 65, y: 28 },
      21: { x: 50, y: 28 },
    } as Record<number, { x: number; y: number }>;
  });

  protected stagedOutIds = computed(() => {
    return new Set(this.stagedSubs().map(s => s.outPlayerId));
  });

  protected stagedInPlayers = computed(() => {
    const stagedSubs = this.stagedSubs();
    const activePlayers = this.players() as (Player & { slotIndex?: number })[];
    const lineup = this.initialLineup();
    const coordsMap = this.slotCoordinates();

    return stagedSubs.map(sub => {
      const outPlayer = activePlayers.find(p => p.id === sub.outPlayerId);
      if (!outPlayer || outPlayer.slotIndex === undefined) return null;

      const inEntry = lineup.find(e => e.playerId === sub.inPlayerId);
      if (!inEntry) return null;

      const coords = coordsMap[outPlayer.slotIndex];
      // Shift right slightly to avoid overlap
      const shiftedX = coords ? coords.x + 5 : 50;

      return {
        ...inEntry.player,
        slotIndex: outPlayer.slotIndex,
        x: shiftedX,
        y: coords?.y ?? 50,
        isStaged: true
      } as PositionedPlayer;
    }).filter((p): p is PositionedPlayer => p !== null);
  });

  protected positionedPlayers = computed(() => {
    const players = this.players() as (Player & { slotIndex?: number })[];
    const coordsMap = this.slotCoordinates();
    const stagedOut = this.stagedOutIds();
    
    return players.map(player => {
      const slotIndex = player.slotIndex;
      let coords = slotIndex !== undefined ? coordsMap[slotIndex] : { x: 50, y: 50 };
      
      // If player is staged to go out, shift left slightly to avoid overlap
      if (slotIndex !== undefined && stagedOut.has(player.id)) {
        coords = { ...coords, x: coords.x - 5 };
      }

      return {
        ...player,
        x: coords?.x ?? 50,
        y: coords?.y ?? 50
      };
    }) as PositionedPlayer[];
  });

  protected emptyFormationSlots = computed(() => {
    const fSlots = this.formationSlots();
    if (!fSlots || fSlots.length === 0) return [];
    const coordsMap = this.slotCoordinates();
    return fSlots
      .filter((s) => !s.playerId)
      .map((s) => ({
        slotIndex: s.slotIndex,
        positionName: s.positionName || getPositionFromSlot(s.slotIndex),
        x: coordsMap[s.slotIndex]?.x ?? 50,
        y: coordsMap[s.slotIndex]?.y ?? 50,
      }));
  });

  protected candidateSlots = computed(() => {
    const selId = this.selectedPlayerId();
    if (!selId) return [];

    // If no formation slots are provided, fallback emptySlots is used instead
    if (this.formationSlots().length === 0) return [];

    const players = this.players() as (Player & { slotIndex?: number })[];
    const isSelActive = players.some((p) => p.id === selId);

    // If a bench player is selected, never show candidate slots if the pitch is already at maximum capacity
    if (!isSelActive && players.length >= this.playersOnField()) {
      return [];
    }

    const occupiedSlots = new Set(players.map((p) => p.slotIndex).filter((s): s is number => s !== undefined));
    const formationSlotIndices = new Set(this.emptyFormationSlots().map((s) => s.slotIndex));
    const coordsMap = this.slotCoordinates();

    return Object.entries(coordsMap)
      .map(([slot, coords]) => ({ slotIndex: Number(slot), ...coords }))
      .filter((s) => !occupiedSlots.has(s.slotIndex) && !formationSlotIndices.has(s.slotIndex));
  });

  protected emptySlots = computed(() => {
    const selId = this.selectedPlayerId();
    const players = this.players() as (Player & { slotIndex?: number })[];
    const isSelActive = players.some((p) => p.id === selId);

    // If a bench player is selected, never show fallback empty slots if pitch is at maximum capacity
    if (selId && !isSelActive && players.length >= this.playersOnField()) {
      return [];
    }

    const occupiedSlots = new Set(players.map((p) => p.slotIndex).filter((s): s is number => s !== undefined));
    const coordsMap = this.slotCoordinates();

    return Object.entries(coordsMap)
      .map(([slot, coords]) => ({ slotIndex: Number(slot), ...coords }))
      .filter((s) => !occupiedSlots.has(s.slotIndex));
  });

  protected selectPlayer(player: Player, event: Event) {
    this.playerSelected.emit({ player, event });
  }

  protected selectEmptySlot(slotIndex: number) {
    const selId = this.selectedPlayerId();
    const players = this.players() as (Player & { slotIndex?: number })[];
    const isSelActive = players.some((p) => p.id === selId);

    if (selId && !isSelActive && players.length >= this.playersOnField()) {
      return; // Cannot add bench player to empty slot if pitch is at maximum capacity
    }
    this.emptySlotSelected.emit(slotIndex);
  }

  protected deselect() {
    this.backgroundClicked.emit();
  }

  protected trackBySlot(index: number, player: PositionedPlayer): string | number {
    return player.slotIndex !== undefined ? player.slotIndex : player.id;
  }

  protected formatPlaytime(playerId: string): string {
    if (!this.showPlaytime()) return '';
    const seconds = this.playtimeService.playtimeMap()[playerId] || 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
