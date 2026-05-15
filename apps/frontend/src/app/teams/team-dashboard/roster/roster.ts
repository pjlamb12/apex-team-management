import { Component, inject, signal, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonText,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, pencilOutline, trashOutline, statsChartOutline } from 'ionicons/icons';
import { AnalyticsService, ParticipationStats, PlayersService, PlayerEntity, CreatePlayerDto, UpdatePlayerDto } from '@apex-team/client/data-access/team';
import { PlayerModal } from '../../player-modal/player-modal';
import { PlayerProfileAnalyticsComponent } from '../analytics/player-profile/player-profile';

@Component({
  selector: 'app-roster',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonText,
  ],
  templateUrl: './roster.html',
})
export class Roster {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  public get teamId(): string {
    return this._teamId() ?? '';
  }

  private readonly playersService = inject(PlayersService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);

  protected players = signal<PlayerEntity[]>([]);
  protected participationStats = signal<Record<string, ParticipationStats>>({});
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ addOutline, pencilOutline, trashOutline, statsChartOutline });

    // Load players whenever teamId changes
    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadPlayers(id);
      }
    });
  }

  protected async loadPlayers(teamId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [players, stats] = await Promise.all([
        firstValueFrom(this.playersService.getPlayers(teamId)),
        firstValueFrom(this.analyticsService.getParticipationStats(teamId))
      ]);
      this.players.set([...players].sort((a, b) => (a.jerseyNumber ?? Infinity) - (b.jerseyNumber ?? Infinity)));
      
      const statsMap: Record<string, ParticipationStats> = {};
      stats.forEach(s => statsMap[s.playerId] = s);
      this.participationStats.set(statsMap);
    } catch {
      this.errorMessage.set('Failed to load roster. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected getParticipation(playerId: string): number {
    return this.participationStats()[playerId]?.percentage ?? 0;
  }

  protected getParticipationColor(playerId: string): string {
    const p = this.getParticipation(playerId);
    if (p >= 90) return 'success';
    if (p >= 75) return 'primary';
    if (p >= 50) return 'warning';
    return 'danger';
  }

  protected async deletePlayer(playerId: string): Promise<void> {
    const teamId = this.teamId;
    if (!teamId) return;

    const alert = await this.alertCtrl.create({
      header: 'Remove Player?',
      message: 'Are you sure you want to remove this player from the roster?',
      buttons: [
        'Cancel',
        {
          text: 'Remove',
          role: 'confirm',
          handler: async () => {
            try {
              await firstValueFrom(this.playersService.deletePlayer(teamId, playerId));
              this.players.update((list) => list.filter((p) => p.id !== playerId));
            } catch {
              this.errorMessage.set('Failed to remove player. Please try again.');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  protected async openPlayerModal(player?: PlayerEntity): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: PlayerModal,
      componentProps: player ? { player } : {},
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<CreatePlayerDto>();
    if (role !== 'confirm' || !data) return;

    try {
      if (player?.id) {
        const updated = await firstValueFrom(
          this.playersService.updatePlayer(this.teamId, player.id, data as UpdatePlayerDto)
        );
        this.players.update((list) =>
          list.map((p) => (p.id === player.id ? updated : p))
        );
      } else {
        const created = await firstValueFrom(
          this.playersService.addPlayer(this.teamId, data as CreatePlayerDto)
        );
        this.players.update((list) => [...list, created]);
      }
    } catch {
      this.errorMessage.set('Failed to save player. Please try again.');
    }
  }

  protected async openPlayerAnalytics(player: PlayerEntity): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: PlayerProfileAnalyticsComponent,
      componentProps: { 
        teamId: this.teamId,
        playerId: player.id
      },
    });

    await modal.present();
  }
}
