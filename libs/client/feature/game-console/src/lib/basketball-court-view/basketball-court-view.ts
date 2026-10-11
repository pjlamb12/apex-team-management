import {
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  closeCircle,
  funnelOutline,
  basketballOutline,
  refreshOutline,
  addOutline,
  trashOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Player } from '@apex-team/shared/util/models';
import { calculateShotType, ShotGeometryResult } from './basketball-shot-geometry';

export interface LineupSlot {
  slotIndex: number;
  positionName?: string | null;
  playerId?: string | null;
}

export interface ShotEventRecord {
  id?: string;
  type: 'MADE_1PT' | 'MISSED_1PT' | 'MADE_2PT' | 'MISSED_2PT' | 'MADE_3PT' | 'MISSED_3PT';
  playerId: string;
  playerName?: string;
  playerJersey?: string | number | null;
  x?: number;
  y?: number;
  distanceFeet?: number;
  minuteOccurred?: number;
  period?: number;
}

export interface ShotLoggedPayload {
  type: 'MADE_1PT' | 'MISSED_1PT' | 'MADE_2PT' | 'MISSED_2PT' | 'MADE_3PT' | 'MISSED_3PT';
  playerId: string;
  x: number;
  y: number;
  distanceFeet: number;
  assistorId?: string;
}

@Component({
  selector: 'app-basketball-court-view',
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton, IonSegment, IonSegmentButton, IonLabel],
  templateUrl: './basketball-court-view.html',
  styleUrls: ['./basketball-court-view.scss'],
})
export class BasketballCourtViewComponent {
  courtContainer = viewChild<ElementRef<HTMLElement>>('courtContainer');

  // Inputs
  players = input<Player[]>([]);
  activePlayers = input<(Player & { slotIndex?: number; preferredPosition?: string })[]>([]);
  selectedPlayerId = input<string | null>(null);
  shots = input<ShotEventRecord[]>([]);
  isLineupMode = input<boolean>(false);
  formationSlots = input<LineupSlot[]>([]);
  selectedSlotIndex = input<number | null>(null);
  playersOnField = input<number>(5);

  // Outputs
  shotLogged = output<ShotLoggedPayload>();
  playerSelected = output<{ player: Player; event: Event }>();
  emptySlotSelected = output<number>();
  backgroundClicked = output<void>();

  // Filter state
  shotFilter = signal<'all' | 'makes' | 'misses'>('all');
  filterPlayerId = signal<string | null>(null);
  isHalfCourt = signal<boolean>(true);

  // Active touch HUD state
  activeTouch = signal<{
    x: number;
    y: number;
    pixelX: number;
    pixelY: number;
    shotType: '2PT' | '3PT';
    distanceFeet: number;
    zone: string;
    overrideShotType?: '2PT' | '3PT' | '1PT';
    targetPlayerId?: string;
  } | null>(null);

  // Default starter court slot coordinates (0: PG, 1: SG, 2: SF, 3: PF, 4: C)
  protected slotCoordinates = computed(() => {
    return {
      0: { x: 50, y: 72, name: 'PG (Point Guard)' },
      1: { x: 80, y: 55, name: 'SG (Shooting Guard)' },
      2: { x: 20, y: 55, name: 'SF (Small Forward)' },
      3: { x: 28, y: 28, name: 'PF (Power Forward)' },
      4: { x: 72, y: 28, name: 'C (Center)' },
    } as Record<number, { x: number; y: number; name: string }>;
  });

  // Filtered shot list based on user selections
  protected filteredShots = computed(() => {
    const list = this.shots().filter((s) => s.x !== undefined && s.y !== undefined);
    const filter = this.shotFilter();
    const pid = this.filterPlayerId();

    return list.filter((shot) => {
      // Filter by make / miss
      if (filter === 'makes' && !shot.type.startsWith('MADE')) return false;
      if (filter === 'misses' && !shot.type.startsWith('MISSED')) return false;

      // Filter by player
      if (pid && shot.playerId !== pid) return false;

      return true;
    });
  });

  // Candidate empty starter slots for lineup editor
  protected emptyFormationSlots = computed(() => {
    const fSlots = this.formationSlots();
    if (!fSlots || fSlots.length === 0) return [];
    const coordsMap = this.slotCoordinates();

    return fSlots
      .filter((s) => !s.playerId)
      .map((s) => ({
        slotIndex: s.slotIndex,
        positionName: s.positionName || coordsMap[s.slotIndex]?.name || `Slot ${s.slotIndex + 1}`,
        x: coordsMap[s.slotIndex]?.x ?? 50,
        y: coordsMap[s.slotIndex]?.y ?? 50,
      }));
  });

  // Starter players positioned on court for lineup/tactical view
  protected positionedPlayers = computed(() => {
    const active = this.activePlayers();
    const coordsMap = this.slotCoordinates();

    return active.map((player) => {
      const slotIndex = player.slotIndex;
      const coords = slotIndex !== undefined ? coordsMap[slotIndex] : { x: 50, y: 50 };
      return {
        ...player,
        x: coords?.x ?? 50,
        y: coords?.y ?? 50,
      };
    });
  });

  constructor() {
    addIcons({
      checkmarkCircle,
      closeCircle,
      funnelOutline,
      basketballOutline,
      refreshOutline,
      addOutline,
      trashOutline,
    });
  }

  // Handle court tap/touch
  protected handleCourtClick(event: MouseEvent | TouchEvent): void {
    if (this.isLineupMode()) {
      this.backgroundClicked.emit();
      return;
    }

    const containerEl = this.courtContainer()?.nativeElement;
    if (!containerEl) return;

    const rect = containerEl.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY;

    const pixelX = clientX - rect.left;
    const pixelY = clientY - rect.top;

    const x = Math.max(0, Math.min(100, (pixelX / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (pixelY / rect.height) * 100));

    const geo: ShotGeometryResult = calculateShotType(x, y, this.isHalfCourt());

    // Pre-select player if one is already selected in console/strip
    const currentSelectedId = this.selectedPlayerId();
    const initialPlayerId = currentSelectedId || (this.activePlayers().length > 0 ? this.activePlayers()[0].id : undefined);

    this.activeTouch.set({
      x,
      y,
      pixelX,
      pixelY,
      shotType: geo.shotType,
      distanceFeet: geo.distanceFeet,
      zone: geo.zone,
      targetPlayerId: initialPlayerId,
    });

    void this.triggerHaptic(ImpactStyle.Light);
  }

  protected setShotTypeOverride(type: '2PT' | '3PT' | '1PT'): void {
    const current = this.activeTouch();
    if (!current) return;
    this.activeTouch.set({
      ...current,
      overrideShotType: type,
    });
    void this.triggerHaptic(ImpactStyle.Light);
  }

  protected setTargetPlayer(playerId: string): void {
    const current = this.activeTouch();
    if (!current) return;
    this.activeTouch.set({
      ...current,
      targetPlayerId: playerId,
    });
    void this.triggerHaptic(ImpactStyle.Light);
  }

  protected confirmShot(isMade: boolean): void {
    const touch = this.activeTouch();
    if (!touch) return;

    const playerId = touch.targetPlayerId || this.selectedPlayerId();
    if (!playerId) {
      // Cannot log shot without a player
      return;
    }

    const finalShotType = touch.overrideShotType || touch.shotType;
    let eventType: ShotLoggedPayload['type'];

    if (finalShotType === '3PT') {
      eventType = isMade ? 'MADE_3PT' : 'MISSED_3PT';
    } else if (finalShotType === '1PT') {
      eventType = isMade ? 'MADE_1PT' : 'MISSED_1PT';
    } else {
      eventType = isMade ? 'MADE_2PT' : 'MISSED_2PT';
    }

    this.shotLogged.emit({
      type: eventType,
      playerId,
      x: Math.round(touch.x * 10) / 10,
      y: Math.round(touch.y * 10) / 10,
      distanceFeet: touch.distanceFeet,
    });

    void this.triggerHaptic(isMade ? ImpactStyle.Heavy : ImpactStyle.Medium);
    this.activeTouch.set(null);
  }

  protected dismissHud(): void {
    this.activeTouch.set(null);
  }

  protected setFilter(filter: any): void {
    if (filter === 'all' || filter === 'makes' || filter === 'misses') {
      this.shotFilter.set(filter);
      void this.triggerHaptic(ImpactStyle.Light);
    }
  }

  protected togglePlayerFilter(playerId: string | null): void {
    this.filterPlayerId.set(this.filterPlayerId() === playerId ? null : playerId);
    void this.triggerHaptic(ImpactStyle.Light);
  }

  protected toggleHalfCourt(): void {
    this.isHalfCourt.update((v) => !v);
    void this.triggerHaptic(ImpactStyle.Light);
  }

  protected selectPlayerSlot(player: Player, event: Event): void {
    event.stopPropagation();
    this.playerSelected.emit({ player, event });
    void this.triggerHaptic(ImpactStyle.Light);
  }

  protected selectEmptySlot(slotIndex: number, event: Event): void {
    event.stopPropagation();
    this.emptySlotSelected.emit(slotIndex);
    void this.triggerHaptic(ImpactStyle.Light);
  }

  protected getPlayerJersey(playerId: string): string | number {
    const p = this.players().find((pl) => pl.id === playerId) ||
      this.activePlayers().find((pl) => pl.id === playerId);
    return p?.jerseyNumber ?? '';
  }

  private async triggerHaptic(style: ImpactStyle): Promise<void> {
    try {
      await Haptics.impact({ style });
    } catch {
      // Haptics unavailable in desktop browser
    }
  }
}
