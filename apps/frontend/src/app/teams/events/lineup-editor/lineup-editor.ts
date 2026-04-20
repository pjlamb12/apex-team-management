import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
} from '@ionic/angular/standalone';
import { EventsService, EventEntity, LineupEntry, SaveLineupDto } from '../events.service';
import { PlayersService, PlayerEntity } from '../../players.service';

interface LineupSlot {
  slotIndex: number;
  positionName: string | null;
  playerId: string | null;
}

@Component({
  selector: 'app-lineup-editor',
  standalone: true,
  imports: [
    CommonModule,
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
  ],
  templateUrl: './lineup-editor.html',
  styleUrl: './lineup-editor.scss',
})
export class LineupEditor implements OnInit {
  private readonly eventsService = inject(EventsService);
  private readonly playersService = inject(PlayersService);
  private readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);

  protected event = signal<EventEntity | null>(null);
  protected players = signal<PlayerEntity[]>([]);
  protected slots = signal<LineupSlot[]>(
    Array.from({ length: 11 }, (_, i) => ({
      slotIndex: i,
      positionName: null,
      playerId: null,
    }))
  );
  protected isLoading = signal(true);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected readonly positionOptions = ['GK', 'DEF', 'MID', 'FWD'];

  protected assignedPlayerIds = computed(() => {
    return new Set(
      this.slots()
        .map((s) => s.playerId)
        .filter((id): id is string => !!id)
    );
  });

  protected benchPlayers = computed(() => {
    const assigned = this.assignedPlayerIds();
    return this.players().filter((p) => !assigned.has(p.id));
  });

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    const teamId = this.route.snapshot.paramMap.get('id');
    if (eventId && teamId) {
      void this.loadData(teamId, eventId);
    }
  }

  private async loadData(teamId: string, eventId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [event, players, lineup] = await Promise.all([
        firstValueFrom(this.eventsService.getEvent(teamId, eventId)),
        firstValueFrom(this.playersService.getPlayers(teamId)),
        firstValueFrom(this.eventsService.getLineup(teamId, eventId)),
      ]);

      this.event.set(event);
      this.players.set(players);

      // Map existing lineup to slots
      const startingLineup = lineup.filter((e) => e.status === 'starting');
      this.slots.update((currentSlots) => {
        const newSlots = [...currentSlots];
        // Reset slots first
        for (let i = 0; i < 11; i++) {
          newSlots[i] = { slotIndex: i, positionName: null, playerId: null };
        }
        startingLineup.forEach((entry, index) => {
          if (index < 11) {
            newSlots[index] = {
              slotIndex: index,
              positionName: entry.positionName,
              playerId: entry.playerId,
            };
          }
        });
        return newSlots;
      });
    } catch (err) {
      console.error('Failed to load lineup data', err);
      this.errorMessage.set('Failed to load data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected availablePlayers(currentSlotIndex: number): PlayerEntity[] {
    const otherAssignedIds = new Set(
      this.slots()
        .filter((s) => s.slotIndex !== currentSlotIndex)
        .map((s) => s.playerId)
        .filter((id): id is string => !!id)
    );
    return this.players().filter((p) => !otherAssignedIds.has(p.id));
  }

  protected updateSlot(
    index: number,
    field: keyof LineupSlot,
    value: any
  ): void {
    this.slots.update((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  protected async onSave(goLive = false): Promise<void> {
    const eventId = this.event()?.id;
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
        void this.router.navigate(['/teams', teamId]);
      }
    } catch (err) {
      console.error('Failed to save lineup', err);
      this.errorMessage.set('Failed to save lineup. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected get teamId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }
}
