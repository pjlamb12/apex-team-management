import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  gitMergeOutline,
  personOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  arrowForwardOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import { PlayersService, PlayerEntity } from '@apex-team/client/data-access/team';

@Component({
  selector: 'app-merge-player-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSegment,
    IonSegmentButton,
  ],
  templateUrl: './merge-player-modal.html',
  styleUrl: './merge-player-modal.scss',
})
export class MergePlayerModal implements OnInit {
  @Input() teamId!: string;
  @Input() preselectedTargetId?: string;
  @Input() preselectedSourceId?: string;
  @Input() guestOnly: boolean = false;

  private readonly playersService = inject(PlayersService);
  private readonly modalCtrl = inject(ModalController);

  protected isLoading = signal(true);
  protected isMerging = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected players = signal<PlayerEntity[]>([]);

  protected filterMode = signal<'all' | 'guests'>('all');
  protected targetPlayerId = signal<string | null>(null);
  protected sourcePlayerId = signal<string | null>(null);

  protected filteredPlayers = computed(() => {
    const mode = this.filterMode();
    const list = this.players();
    if (mode === 'guests') {
      return list.filter((p) => p.isGuest);
    }
    return list;
  });

  protected targetPlayer = computed(() => {
    const id = this.targetPlayerId();
    if (!id) return null;
    return this.players().find((p) => p.id === id) ?? null;
  });

  protected sourcePlayer = computed(() => {
    const id = this.sourcePlayerId();
    if (!id) return null;
    return this.players().find((p) => p.id === id) ?? null;
  });

  protected canMerge = computed(() => {
    const tId = this.targetPlayerId();
    const sId = this.sourcePlayerId();
    return !!tId && !!sId && tId !== sId && !this.isMerging();
  });

  constructor() {
    addIcons({
      closeOutline,
      gitMergeOutline,
      personOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      arrowForwardOutline,
      swapHorizontalOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    if (this.guestOnly) {
      this.filterMode.set('guests');
    }
    if (this.preselectedTargetId) {
      this.targetPlayerId.set(this.preselectedTargetId);
    }
    if (this.preselectedSourceId) {
      this.sourcePlayerId.set(this.preselectedSourceId);
    }
    await this.loadAllPlayers();
  }

  protected async loadAllPlayers(): Promise<void> {
    if (!this.teamId) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      // Fetch both regular roster players and guest players
      const [regularPlayers, guestPlayers] = await Promise.all([
        firstValueFrom(this.playersService.getPlayers(this.teamId, true)).catch(() => []),
        firstValueFrom(this.playersService.getGuestPlayers(this.teamId)).catch(() => []),
      ]);

      const map = new Map<string, PlayerEntity>();
      regularPlayers.forEach((p) => map.set(p.id, p));
      guestPlayers.forEach((g) => map.set(g.id, g));

      const combined = Array.from(map.values()).sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      this.players.set(combined);

      // If preselected target or source was passed, verify they exist
      if (this.preselectedTargetId && map.has(this.preselectedTargetId)) {
        this.targetPlayerId.set(this.preselectedTargetId);
      }
      if (this.preselectedSourceId && map.has(this.preselectedSourceId)) {
        this.sourcePlayerId.set(this.preselectedSourceId);
      }
    } catch (err) {
      console.error('Failed to load players for merge modal', err);
      this.errorMessage.set('Failed to load player roster.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onTargetChange(event: CustomEvent): void {
    this.targetPlayerId.set(event.detail.value);
  }

  protected onSourceChange(event: CustomEvent): void {
    this.sourcePlayerId.set(event.detail.value);
  }

  protected swapSelection(): void {
    const currentTarget = this.targetPlayerId();
    const currentSource = this.sourcePlayerId();
    this.targetPlayerId.set(currentSource);
    this.sourcePlayerId.set(currentTarget);
  }

  protected async dismiss(result?: { merged: boolean; targetPlayerId?: string; sourcePlayerId?: string }): Promise<void> {
    await this.modalCtrl.dismiss(result, result?.merged ? 'confirm' : 'cancel');
  }

  protected async executeMerge(): Promise<void> {
    const targetId = this.targetPlayerId();
    const sourceId = this.sourcePlayerId();

    if (!targetId || !sourceId || targetId === sourceId) {
      return;
    }

    this.isMerging.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(
        this.playersService.mergePlayers(this.teamId, targetId, sourceId)
      );

      await this.dismiss({
        merged: true,
        targetPlayerId: targetId,
        sourcePlayerId: sourceId,
      });
    } catch (err: any) {
      console.error('Failed to merge players', err);
      const msg = err?.error?.message || 'Failed to merge player profiles. Please try again.';
      this.errorMessage.set(msg);
      this.isMerging.set(false);
    }
  }
}
