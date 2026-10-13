import { Component, inject, signal, computed, Input, OnInit } from '@angular/core';
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
  IonIcon,
  IonSpinner,
  IonToast,
  IonBadge,
  IonTextarea,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  starOutline,
  shieldOutline,
  flashOutline,
  heartOutline,
  eyeOutline,
  trendingUpOutline,
  handLeftOutline,
  flameOutline,
  trashOutline,
  checkmarkOutline,
  trophyOutline,
  addOutline,
  personOutline,
  ribbonOutline,
  sparklesOutline,
} from 'ionicons/icons';
import {
  AwardsService,
  PlayersService,
} from '@apex-team/client/data-access/team';
import {
  PlayerAward,
  Player,
  AwardBadgeDefinition,
  DEFAULT_BADGE_PRESETS,
  getSportBadgePresets,
} from '@apex-team/shared/util/models';

@Component({
  selector: 'app-award-badge-modal',
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
    IonIcon,
    IonSpinner,
    IonToast,
    IonBadge,
    IonTextarea,
  ],
  templateUrl: './award-badge-modal.html',
  styleUrl: './award-badge-modal.scss',
})
export class AwardBadgeModalComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly awardsService = inject(AwardsService);
  private readonly playersService = inject(PlayersService);

  @Input({ required: true }) teamId!: string;
  @Input({ required: true }) eventId!: string;
  @Input() seasonId?: string;

  private readonly _sportName = signal<string | null>(null);

  @Input()
  set sportName(value: string | null | undefined) {
    this._sportName.set(value ?? null);
    const sportBadges = getSportBadgePresets(value);
    this.badges.set(sportBadges);
    if (!this.selectedBadge() || !sportBadges.some((b) => b.type === this.selectedBadge().type)) {
      this.selectedBadge.set(sportBadges[0]);
    }
  }
  get sportName(): string | null {
    return this._sportName();
  }

  protected readonly badges = signal<AwardBadgeDefinition[]>(DEFAULT_BADGE_PRESETS);
  protected readonly isBasketball = computed(() => (this._sportName() || '').trim().toLowerCase().includes('basket'));
  protected readonly isVolleyball = computed(() => (this._sportName() || '').trim().toLowerCase().includes('volley'));
  protected readonly modalTitle = computed(() =>
    this.isBasketball() ? 'Award Game Badges & Honors' : 'Award Match Badges & Honors'
  );
  protected readonly modalSubtitle = computed(() =>
    this.isBasketball()
      ? 'Recognize Player of the Game, grit, defense, and teamwork'
      : 'Recognize Player of the Match, grit, defense, and teamwork'
  );
  protected readonly notesPlaceholder = computed(() => {
    if (this.isBasketball()) {
      return 'e.g. Clutch 4th-quarter stops, commanding the glass, and sealing the win!';
    }
    if (this.isVolleyball()) {
      return 'e.g. Incredible diving digs and a huge 5-point service run in the 3rd set!';
    }
    return 'e.g. Incredible 1v1 defensive stops in the 2nd half, keeping the clean sheet intact!';
  });

  protected readonly players = signal<Player[]>([]);
  protected readonly eventAwards = signal<PlayerAward[]>([]);
  protected readonly selectedPlayerId = signal<string | null>(null);
  protected readonly selectedBadge = signal<AwardBadgeDefinition>(DEFAULT_BADGE_PRESETS[0]);
  protected readonly coachNotes = signal<string>('');

  protected readonly isLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isToastOpen = signal<boolean>(false);
  protected readonly toastMessage = signal<string>('');

  constructor() {
    addIcons({
      closeOutline,
      starOutline,
      shieldOutline,
      flashOutline,
      heartOutline,
      eyeOutline,
      trendingUpOutline,
      handLeftOutline,
      flameOutline,
      trashOutline,
      checkmarkOutline,
      trophyOutline,
      addOutline,
      personOutline,
      ribbonOutline,
      sparklesOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    if (this._sportName()) {
      const sportBadges = getSportBadgePresets(this._sportName());
      this.badges.set(sportBadges);
      if (!this.selectedBadge() || !sportBadges.some((b) => b.type === this.selectedBadge().type)) {
        this.selectedBadge.set(sportBadges[0]);
      }
    }
    await this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [playersList, awardsList] = await Promise.all([
        firstValueFrom(this.playersService.getPlayers(this.teamId)),
        firstValueFrom(this.awardsService.getEventAwards(this.teamId, this.eventId)),
      ]);

      const activePlayers = (playersList || []).filter((p) => p.isActive);
      this.players.set(activePlayers);
      this.eventAwards.set(awardsList || []);

      if (activePlayers.length > 0 && !this.selectedPlayerId()) {
        this.selectedPlayerId.set(activePlayers[0].id);
      }
    } catch (err) {
      console.error('Failed to load award data', err);
      this.showToast('Could not load players or awards.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected selectPlayer(playerId: string): void {
    this.selectedPlayerId.set(playerId);
  }

  protected selectBadge(badge: AwardBadgeDefinition): void {
    this.selectedBadge.set(badge);
  }

  protected async submitAward(): Promise<void> {
    const playerId = this.selectedPlayerId();
    const badge = this.selectedBadge();
    if (!playerId || !badge) return;

    this.isSubmitting.set(true);
    try {
      const newAward = await firstValueFrom(
        this.awardsService.createAward(this.teamId, {
          playerId,
          eventId: this.eventId,
          seasonId: this.seasonId,
          badgeType: badge.type,
          title: badge.title,
          category: badge.category,
          icon: badge.icon,
          color: badge.color,
          notes: this.coachNotes().trim() || undefined,
        }),
      );

      this.eventAwards.update((prev) => [newAward, ...prev]);
      this.coachNotes.set('');
      this.showToast(`Awarded "${badge.title}" successfully! 🌟`);
    } catch (err) {
      console.error('Failed to create award', err);
      this.showToast('Failed to award badge. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected async deleteAward(awardId: string): Promise<void> {
    try {
      await firstValueFrom(this.awardsService.deleteAward(this.teamId, awardId));
      this.eventAwards.update((prev) => prev.filter((a) => a.id !== awardId));
      this.showToast('Award removed.');
    } catch (err) {
      console.error('Failed to delete award', err);
      this.showToast('Could not remove award.');
    }
  }

  protected showToast(msg: string): void {
    this.toastMessage.set(msg);
    this.isToastOpen.set(true);
  }

  protected closeToast(): void {
    this.isToastOpen.set(false);
  }

  protected dismiss(saved = false): void {
    void this.modalCtrl.dismiss({ saved, awards: this.eventAwards() });
  }
}
