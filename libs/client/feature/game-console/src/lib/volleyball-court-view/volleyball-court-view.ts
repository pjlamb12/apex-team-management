import { Component, input, output, computed, inject } from '@angular/core';
import { Player, StagedSub, LineupEntry } from '@apex-team/shared/util/models';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { PlaytimeService } from '../rotation-engine/playtime.service';

export interface VolleyballPositionedPlayer extends Player {
  x: number;
  y: number;
  slotIndex?: number;
  isStaged?: boolean;
}

@Component({
  selector: 'app-volleyball-court-view',
  imports: [IonIcon],
  templateUrl: './volleyball-court-view.html',
  styleUrls: ['./volleyball-court-view.scss'],
})
export class VolleyballCourtViewComponent {
  protected playtimeService = inject(PlaytimeService);

  players = input.required<Player[]>();
  initialLineup = input<LineupEntry[]>([]);
  stagedSubs = input<StagedSub[]>([]);
  playersOnField = input<number>(6);
  selectedPlayerId = input<string | null>(null);
  playerStats = input<Record<string, { kills: number; aces: number; blocks: number; digs: number; assists: number; serviceErrors: number; hittingErrors: number }>>({});
  liberoDesignation = input<{ liberoId: string; replacedId: string } | null>(null);
  showLiberoSlot = input<boolean>(false);
  playerSelected = output<{ player: Player; event: Event }>();
  emptySlotSelected = output<number>();
  backgroundClicked = output<void>();

  constructor() {
    addIcons({ addOutline });
  }

  protected slotCoordinates = computed(() => {
    const coords: Record<number, { x: number; y: number; name: string }> = {
      0: { x: 75, y: 75, name: 'Zone 1 (Back Right)' },
      1: { x: 75, y: 35, name: 'Zone 2 (Front Right)' },
      2: { x: 50, y: 35, name: 'Zone 3 (Front Middle)' },
      3: { x: 25, y: 35, name: 'Zone 4 (Front Left)' },
      4: { x: 25, y: 75, name: 'Zone 5 (Back Left)' },
      5: { x: 50, y: 75, name: 'Zone 6 (Back Middle)' },
    };
    if (this.showLiberoSlot()) {
      coords[99] = { x: 35, y: 86, name: 'Libero' };
    }
    return coords;
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
      const shiftedX = coords ? coords.x + 5 : 50;

      return {
        ...inEntry.player,
        slotIndex: outPlayer.slotIndex,
        x: shiftedX,
        y: coords?.y ?? 50,
        isStaged: true
      } as VolleyballPositionedPlayer;
    }).filter((p): p is VolleyballPositionedPlayer => p !== null);
  });

  protected positionedPlayers = computed(() => {
    const players = this.players() as (Player & { slotIndex?: number })[];
    const coordsMap = this.slotCoordinates();
    const stagedOut = this.stagedOutIds();
    
    return players.map(player => {
      const slotIndex = player.slotIndex;
      let coords = slotIndex !== undefined ? coordsMap[slotIndex] : { x: 50, y: 50 };
      
      if (slotIndex !== undefined && stagedOut.has(player.id)) {
        coords = { ...coords, x: coords.x - 5 };
      }

      return {
        ...player,
        x: coords?.x ?? 50,
        y: coords?.y ?? 50
      };
    }) as VolleyballPositionedPlayer[];
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

  protected trackBySlot(index: number, player: VolleyballPositionedPlayer): string | number {
    return player.slotIndex !== undefined ? player.slotIndex : player.id;
  }

  protected getStatsString(playerId: string): string {
    const stats = this.playerStats()[playerId];
    if (!stats) return 'K: 0 | A: 0 | B: 0';
    return `K: ${stats.kills} | A: ${stats.aces} | B: ${stats.blocks}`;
  }
}
