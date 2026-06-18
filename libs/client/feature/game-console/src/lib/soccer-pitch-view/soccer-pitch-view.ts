import { Component, input, output, computed, inject } from '@angular/core';
import { Player, StagedSub, LineupEntry } from '@apex-team/shared/util/models';
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
      1: { x: 15, y: 68 },
      2: { x: 32.5, y: 68 },
      3: { x: 50, y: 68 },
      4: { x: 67.5, y: 68 },
      5: { x: 85, y: 68 },

      // Midfielders (6-10)
      6: { x: 15, y: 44 },
      7: { x: 32.5, y: 44 },
      8: { x: 50, y: 44 },
      9: { x: 67.5, y: 44 },
      10: { x: 85, y: 44 },

      // Forwards (11-15)
      11: { x: 15, y: 20 },
      12: { x: 32.5, y: 20 },
      13: { x: 50, y: 20 },
      14: { x: 67.5, y: 20 },
      15: { x: 85, y: 20 },
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

  protected emptySlots = computed(() => {
    const players = this.players() as (Player & { slotIndex?: number })[];
    const occupiedSlots = new Set(players.map(p => p.slotIndex).filter((s): s is number => s !== undefined));
    const coordsMap = this.slotCoordinates();
    
    return Object.entries(coordsMap)
      .map(([slot, coords]) => ({ slotIndex: Number(slot), ...coords }))
      .filter(s => !occupiedSlots.has(s.slotIndex));
  });

  protected selectPlayer(player: Player, event: Event) {
    this.playerSelected.emit({ player, event });
  }

  protected selectEmptySlot(slotIndex: number) {
    this.emptySlotSelected.emit(slotIndex);
  }

  protected deselect() {
    this.backgroundClicked.emit();
  }

  protected trackBySlot(index: number, player: PositionedPlayer): string | number {
    return player.slotIndex !== undefined ? player.slotIndex : player.id;
  }

  protected formatPlaytime(playerId: string): string {
    const seconds = this.playtimeService.playtimeMap()[playerId] || 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
