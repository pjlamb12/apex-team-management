import { Component, inject, signal, effect, computed, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonListHeader,
  IonNote,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonToast,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import {
  EventsService,
  EventEntity,
  LineupEntry,
  SaveLineupDto,
  PlayersService,
  PlayerEntity,
  AttendanceService,
  AttendanceRecord,
} from '@apex-team/client/data-access/team';
import { SoccerPitchViewComponent } from '@apex-team/client/feature/game-console';
import { Player } from '@apex-team/shared/util/models';
import { AttendanceList } from '@apex-team/client/ui/attendance';

interface LineupSlot {
  slotIndex: number;
  positionName: string | null;
  playerId: string | null;
}

function getDefaultSlots(count: number): number[] {
  if (count === 11) return [0, 1, 2, 4, 5, 6, 7, 9, 10, 12, 14]; // GK, 4 DEF, 4 MID, 2 FWD
  if (count === 9) return [0, 2, 3, 4, 7, 8, 9, 12, 14]; // GK, 3 DEF, 3 MID, 2 FWD
  if (count === 7) return [0, 2, 4, 7, 8, 9, 13]; // GK, 2 DEF, 3 MID, 1 FWD
  if (count === 5) return [0, 2, 4, 8, 13]; // GK, 2 DEF, 1 MID, 1 FWD
  return Array.from({length: count}, (_, i) => i);
}

function getPositionFromSlot(slot: number): string {
  if (slot === 0) return 'GK';
  if (slot >= 1 && slot <= 5) return 'DEF';
  if (slot >= 6 && slot <= 10) return 'MID';
  if (slot >= 11 && slot <= 15) return 'FWD';
  return 'UNKNOWN';
}

@Component({
  selector: 'app-lineup-editor',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    IonListHeader,
    IonNote,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonIcon,
    IonToast,
    SoccerPitchViewComponent,
    AttendanceList,
  ],
  templateUrl: './lineup-editor.html',
  styleUrl: './lineup-editor.scss',
})
export class LineupEditor implements OnInit {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  private _eventId = signal<string | null>(null);

  public get teamId(): string {
    return this._teamId() ?? '';
  }

  @Input() set eventId(val: string) {
    this._eventId.set(val);
  }

  public get eventId(): string {
    return this._eventId() ?? '';
  }

  private readonly eventsService = inject(EventsService);
  private readonly playersService = inject(PlayersService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly router = inject(Router);

  protected event = signal<EventEntity | null>(null);
  protected players = signal<PlayerEntity[]>([]);
  protected attendance = signal<AttendanceRecord[]>([]);
  protected slots = signal<LineupSlot[]>([]);
  protected isLoading = signal(true);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected viewMode = signal<'list' | 'pitch' | 'attendance'>('list');
  protected selectedPlayerId = signal<string | null>(null);
  protected toastMessage = signal<string | null>(null);

  protected setViewMode(mode: any): void {
    this.viewMode.set(mode);
  }

  protected readonly positionOptions = ['GK', 'DEF', 'MID', 'FWD'];

  protected assignedPlayerIds = computed(() => {
    return new Set(
      this.slots()
        .map((s) => s.playerId)
        .filter((id): id is string => !!id)
    );
  });

  protected absentPlayerIds = computed(() => {
    return new Set(
      this.attendance()
        .filter((a) => a.status === 'absent')
        .map((a) => a.playerId)
    );
  });

  protected benchPlayers = computed(() => {
    const assigned = this.assignedPlayerIds();
    const absent = this.absentPlayerIds();
    return this.players().filter((p) => !assigned.has(p.id) && !absent.has(p.id));
  });

  protected pitchPlayers = computed(() => {
    const players = this.players();
    return this.slots()
      .filter((s) => !!s.playerId)
      .map((s) => {
        const p = players.find((p) => p.id === s.playerId);
        if (!p) return null;
        return {
          ...p,
          slotIndex: s.slotIndex,
          preferredPosition: s.positionName || undefined,
        } as Player & { slotIndex: number };
      })
      .filter((p): p is Player & { slotIndex: number } => p !== null);
  });

  constructor() {
    addIcons({ settingsOutline });
    // Load data whenever teamId or eventId changes
    effect(() => {
      const tId = this._teamId();
      const eId = this._eventId();
      if (tId && eId) {
        void this.loadData(tId, eId);
      }
    });
  }

  ngOnInit(): void {
    const tId = this.teamId;
    const eId = this.eventId;
    if (tId && eId) {
      void this.loadData(tId, eId);
    }
  }

  private async loadData(teamId: string, eventId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [event, players, lineup, attendance] = await Promise.all([
        firstValueFrom(this.eventsService.getEvent(teamId, eventId)),
        firstValueFrom(this.playersService.getPlayers(teamId)),
        firstValueFrom(this.eventsService.getLineup(teamId, eventId)),
        firstValueFrom(this.attendanceService.getAttendance(teamId, eventId)),
      ]);

      this.event.set(event);
      this.players.set(players);
      this.attendance.set(attendance);

      const fieldCount = event.playersOnField || 11;
      const defaultSlots = getDefaultSlots(fieldCount);

      // Map existing lineup to slots
      const startingLineup = lineup.filter((e) => e.status === 'starting');
      
      const newSlots: LineupSlot[] = Array.from({ length: fieldCount }, (_, i) => ({
        slotIndex: defaultSlots[i] ?? i,
        positionName: getPositionFromSlot(defaultSlots[i] ?? i),
        playerId: null,
      }));

      // Filter out absent player IDs
      const absent = new Set(attendance.filter((a) => a.status === 'absent').map((a) => a.playerId));

      // Map the players that are already assigned
      startingLineup.forEach((entry, idx) => {
        // Skip if marked absent
        if (absent.has(entry.playerId)) return;

        // If they have a valid slotIndex, try to match it, else assign sequentially
        if (entry.slotIndex !== null) {
          const existingSlot = newSlots.find(s => s.slotIndex === entry.slotIndex);
          if (existingSlot && existingSlot.playerId === null) {
            existingSlot.playerId = entry.playerId;
            existingSlot.positionName = entry.positionName || getPositionFromSlot(entry.slotIndex);
          } else {
             // Fallback
             const emptySlot = newSlots.find(s => s.playerId === null);
             if (emptySlot) {
               emptySlot.playerId = entry.playerId;
               emptySlot.positionName = entry.positionName || getPositionFromSlot(emptySlot.slotIndex);
             }
          }
        } else {
           const emptySlot = newSlots.find(s => s.playerId === null);
           if (emptySlot) {
             emptySlot.playerId = entry.playerId;
             emptySlot.positionName = entry.positionName || getPositionFromSlot(emptySlot.slotIndex);
           }
        }
      });
      this.slots.set(newSlots);
    } catch (err) {
      console.error('Failed to load lineup data', err);
      this.errorMessage.set('Failed to load data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async onAttendanceChanged(): Promise<void> {
    const tId = this.teamId;
    const eId = this.eventId;
    if (tId && eId) {
      try {
        const attendance = await firstValueFrom(this.attendanceService.getAttendance(tId, eId));
        this.attendance.set(attendance);
        
        // Remove any players who are now absent from slots
        const absent = new Set(attendance.filter(a => a.status === 'absent').map(a => a.playerId));
        this.slots.update((current) =>
          current.map((s) => (s.playerId && absent.has(s.playerId) ? { ...s, playerId: null } : s))
        );
      } catch (err) {
        console.error('Failed to update attendance in editor', err);
      }
    }
  }

  protected availablePlayers(currentSlotIndex: number): PlayerEntity[] {
    const otherAssignedIds = new Set(
      this.slots()
        .filter((s) => s.slotIndex !== currentSlotIndex)
        .map((s) => s.playerId)
        .filter((id): id is string => !!id)
    );
    const absent = this.absentPlayerIds();
    return this.players().filter((p) => !otherAssignedIds.has(p.id) && !absent.has(p.id));
  }

  protected updateSlot(
    index: number,
    field: keyof LineupSlot,
    value: any
  ): void {
    this.slots.update((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      
      if (field === 'positionName') {
        const pos = value as string;
        let minSlot = 0, maxSlot = 0;
        if (pos === 'GK') { minSlot = 0; maxSlot = 0; }
        else if (pos === 'DEF') { minSlot = 1; maxSlot = 5; }
        else if (pos === 'MID') { minSlot = 6; maxSlot = 10; }
        else if (pos === 'FWD') { minSlot = 11; maxSlot = 15; }
        
        const currentSlotIndex = next[index].slotIndex;
        if (currentSlotIndex < minSlot || currentSlotIndex > maxSlot) {
          const occupied = new Set(next.map((s, i) => i !== index ? s.slotIndex : -1));
          let newSlot = -1;
          for (let i = minSlot; i <= maxSlot; i++) {
            if (!occupied.has(i)) { newSlot = i; break; }
          }
          if (newSlot !== -1) {
            next[index].slotIndex = newSlot;
          }
        }
      }
      
      return next;
    });
  }

  protected handlePitchPlayerSelected(data: { player: Player; event: Event }): void {
    const { player } = data;
    const currentSelection = this.selectedPlayerId();

    if (!currentSelection) {
      this.selectedPlayerId.set(player.id);
      return;
    }

    if (currentSelection === player.id) {
      this.selectedPlayerId.set(null);
      return;
    }

    // If another player selected, swap slots
    const slots = this.slots();
    const slotAIndex = slots.findIndex(s => s.playerId === currentSelection);
    const slotBIndex = slots.findIndex(s => s.playerId === player.id);

    if (slotAIndex !== -1 && slotBIndex !== -1) {
      const slotAId = slots[slotAIndex].playerId;
      const slotBId = slots[slotBIndex].playerId;

      this.updateSlot(slotAIndex, 'playerId', slotBId);
      this.updateSlot(slotBIndex, 'playerId', slotAId);
    } else if (slotAIndex === -1 && slotBIndex !== -1) {
      // currentSelection is on the bench, clicked player is on the field
      this.updateSlot(slotBIndex, 'playerId', currentSelection);
    } else if (slotBIndex === -1 && slotAIndex !== -1) {
      // player.id is on the bench, currentSelection is on the field
      this.updateSlot(slotAIndex, 'playerId', player.id);
    }

    this.selectedPlayerId.set(null);
  }

  protected handlePitchEmptySlotSelected(targetSlotIndex: number): void {
    const currentSelection = this.selectedPlayerId();
    if (!currentSelection) return;

    const slots = this.slots();
    const currentArrayIndex = slots.findIndex(s => s.playerId === currentSelection);

    if (currentArrayIndex !== -1) {
      // Move from old slot to new slot by just updating the slot properties
      this.updateSlot(currentArrayIndex, 'slotIndex', targetSlotIndex);
      this.updateSlot(currentArrayIndex, 'positionName', getPositionFromSlot(targetSlotIndex));
    } else {
      // Must be from bench. Find an empty item in the array
      const emptyArrayIndex = slots.findIndex(s => s.playerId === null);
      if (emptyArrayIndex !== -1) {
        this.slots.update(current => {
          const next = [...current];
          next[emptyArrayIndex] = {
            ...next[emptyArrayIndex],
            playerId: currentSelection,
            slotIndex: targetSlotIndex,
            positionName: getPositionFromSlot(targetSlotIndex)
          };
          return next;
        });
      }
    }

    this.selectedPlayerId.set(null);
  }

  protected handleBenchPlayerClick(player: PlayerEntity): void {
    const currentSelection = this.selectedPlayerId();
    if (currentSelection === player.id) {
      this.selectedPlayerId.set(null);
    } else if (currentSelection) {
      const slots = this.slots();
      const slotIndex = slots.findIndex(s => s.playerId === currentSelection);
      if (slotIndex !== -1) {
        // Pitch player was selected, clicked bench player to swap them in
        this.updateSlot(slotIndex, 'playerId', player.id);
        this.selectedPlayerId.set(null);
      } else {
        this.selectedPlayerId.set(player.id);
      }
    } else {
      this.selectedPlayerId.set(player.id);
    }
  }

  protected async onSave(goLive = false): Promise<void> {
    const eventId = this.eventId;
    const teamId = this.teamId;
    if (!eventId || !teamId) return;

    this.isSaving.set(true);
    try {
      const dto: SaveLineupDto = {
        entries: [
          // Starters
          ...this.slots()
            .filter((s) => !!s.playerId)
            .map((s) => ({
              playerId: s.playerId!,
              positionName: s.positionName || undefined,
              slotIndex: s.slotIndex,
              status: 'starting' as const,
            })),
          // Bench
          ...this.benchPlayers().map((p) => ({
            playerId: p.id,
            status: 'bench' as const,
          })),
        ],
      };

      await firstValueFrom(this.eventsService.saveLineup(teamId, eventId, dto));
      
      if (goLive) {
        void this.router.navigate(['/teams', teamId, 'events', eventId, 'console']);
      } else {
        this.toastMessage.set('Lineup saved successfully');
      }
    } catch (err) {
      console.error('Failed to save lineup', err);
      this.errorMessage.set('Failed to save lineup. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
