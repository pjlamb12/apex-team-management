import { Component, inject, signal, effect, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  IonContent,
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
  IonSelect,
  IonSelectOption,
  IonButton,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  pencilOutline, 
  trashOutline, 
  statsChartOutline, 
  buildOutline, 
  peopleOutline, 
  personCircleOutline,
  checkmarkCircleOutline,
  pauseCircleOutline,
  refreshOutline,
  removeCircleOutline,
} from 'ionicons/icons';
import { 
  AnalyticsService, 
  ParticipationStats, 
  PlayersService, 
  PlayerEntity, 
  CreatePlayerDto, 
  UpdatePlayerDto,
  SeasonsService,
  CandidatesService,
  CandidateEntity,
  TeamService
} from '@apex-team/client/data-access/team';
import { PlayerModal } from '../../player-modal/player-modal';
import { PlayerProfileAnalyticsComponent } from '../analytics/player-profile/player-profile';
import { ManageSeasonRosterModal } from './manage-roster-modal/manage-roster-modal';

@Component({
  selector: 'app-roster',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
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
    IonSelect,
    IonSelectOption,
    IonButton,
    IonButtons,
    IonSegment,
    IonSegmentButton,
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
  private readonly seasonsService = inject(SeasonsService);
  private readonly candidatesService = inject(CandidatesService);
  private readonly teamService = inject(TeamService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);

  protected players = signal<PlayerEntity[]>([]);
  protected positions = signal<string[]>([]);
  protected activeFilter = signal<'active' | 'inactive' | 'all'>('active');

  protected activePlayerCount = computed(() => this.players().filter(p => p.isActive !== false).length);
  protected inactivePlayerCount = computed(() => this.players().filter(p => p.isActive === false).length);

  protected sortedPlayers = computed(() => {
    const filter = this.activeFilter();
    let list = this.players();
    if (filter === 'active') {
      list = list.filter(p => p.isActive !== false);
    } else if (filter === 'inactive') {
      list = list.filter(p => p.isActive === false);
    }

    return [...list].sort((a, b) => {
      const aNum = a.jerseyNumber !== null && a.jerseyNumber !== undefined ? a.jerseyNumber : Infinity;
      const bNum = b.jerseyNumber !== null && b.jerseyNumber !== undefined ? b.jerseyNumber : Infinity;
      return aNum - bNum;
    });
  });
  protected seasons = this.seasonsService.seasons;
  protected selectedSeasonId = this.seasonsService.selectedSeasonId;
  protected participationStats = signal<Record<string, ParticipationStats>>({});
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ 
      addOutline, 
      pencilOutline, 
      trashOutline, 
      statsChartOutline, 
      buildOutline, 
      peopleOutline, 
      personCircleOutline,
      checkmarkCircleOutline,
      pauseCircleOutline,
      refreshOutline,
      removeCircleOutline,
    });

    // Load players whenever teamId or selectedSeasonId changes
    effect(() => {
      const id = this._teamId();
      const seasonId = this.selectedSeasonId();
      if (id) {
        void this.loadPlayers(id, seasonId);
      }
    });
  }

  ionViewWillEnter(): void {
    const id = this._teamId();
    if (id) {
      void this.seasonsService.initialize(id);
    }
  }

  protected onSeasonChange(event: any): void {
    this.seasonsService.selectedSeasonId.set(event.detail.value);
  }

  protected onFilterChange(event: any): void {
    const val = event.detail.value as 'active' | 'inactive' | 'all';
    if (val) {
      this.activeFilter.set(val);
    }
  }

  protected async loadPlayers(teamId: string, seasonId: string | null): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.players.set([]);
    this.participationStats.set({});
    try {
      let playersReq;
      if (seasonId) {
        playersReq = firstValueFrom(this.playersService.getPlayersForSeason(teamId, seasonId, true));
      } else {
        playersReq = firstValueFrom(this.playersService.getPlayers(teamId, true));
      }

      const [players, stats, team] = await Promise.all([
        playersReq,
        firstValueFrom(this.analyticsService.getParticipationStats(teamId, seasonId ?? undefined)),
        this.teamService.getTeam(teamId)
      ]);
      this.players.set(players);
      this.positions.set(team.sport?.positionTypes || []);
      
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
    const stats = this.participationStats()[playerId];
    if (!stats || stats.totalEvents === 0) {
      return 'warning';
    }
    const p = stats.percentage;
    if (p >= 90) return 'success';
    if (p >= 75) return 'primary';
    if (p >= 50) return 'warning';
    return 'danger';
  }

  protected async deactivatePlayer(player: PlayerEntity): Promise<void> {
    const teamId = this.teamId;
    if (!teamId) return;

    const alert = await this.alertCtrl.create({
      header: 'Player Stepping Away?',
      message: `Remove ${player.firstName} ${player.lastName} from active roster? They will stop appearing on attendance screens and substitute lists, but their past game history and statistics will be preserved.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Step Away',
          role: 'confirm',
          handler: async () => {
            try {
              const updated = await firstValueFrom(this.playersService.deactivatePlayer(teamId, player.id));
              this.players.update((list) =>
                list.map((p) => (p.id === player.id ? { ...p, ...updated, isActive: false } : p))
              );
            } catch {
              this.errorMessage.set('Failed to update player status. Please try again.');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  protected async reactivatePlayer(player: PlayerEntity): Promise<void> {
    const teamId = this.teamId;
    if (!teamId) return;

    const alert = await this.alertCtrl.create({
      header: 'Reactivate Player?',
      message: `Add ${player.firstName} ${player.lastName} back to the active roster?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reactivate',
          role: 'confirm',
          handler: async () => {
            try {
              const updated = await firstValueFrom(this.playersService.reactivatePlayer(teamId, player.id));
              this.players.update((list) =>
                list.map((p) => (p.id === player.id ? { ...p, ...updated, isActive: true } : p))
              );
            } catch {
              this.errorMessage.set('Failed to reactivate player. Please try again.');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  protected async deletePlayer(playerId: string): Promise<void> {
    const teamId = this.teamId;
    const seasonId = this.selectedSeasonId();
    if (!teamId) return;

    const alert = await this.alertCtrl.create({
      header: seasonId ? 'Remove from Season?' : 'Delete Player?',
      message: seasonId 
        ? 'This will remove the player from this season but keep them in your roster pool.' 
        : 'This action is permanent and will delete the player profile and historical records.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: seasonId ? 'Remove' : 'Delete Permanently',
          role: 'confirm',
          handler: async () => {
            try {
              if (seasonId) {
                await firstValueFrom(this.playersService.removePlayerFromSeason(teamId, seasonId, playerId));
              } else {
                await firstValueFrom(this.playersService.deletePlayer(teamId, playerId));
              }
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
      componentProps: player 
        ? { player, positions: this.positions() } 
        : { positions: this.positions() },
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
          this.playersService.addPlayer(this.teamId, {
            ...data,
            seasonId: this.selectedSeasonId() ?? undefined
          } as CreatePlayerDto)
        );
        this.players.update((list) => [...list, created]);
      }
    } catch {
      this.errorMessage.set('Failed to save player. Please try again.');
    }
  }

  protected async manageSeasonRoster() {
    const seasonId = this.selectedSeasonId();
    if (!seasonId) return;

    const modal = await this.modalCtrl.create({
      component: ManageSeasonRosterModal,
      componentProps: {
        teamId: this.teamId,
        seasonId: seasonId,
        currentRosterPlayerIds: this.players().map(p => p.id)
      }
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      const { players, candidates } = data as { players: PlayerEntity[], candidates: CandidateEntity[] };
      
      this.isLoading.set(true);
      try {
        // 1. Add historical players to season
        for (const p of players) {
          await firstValueFrom(this.playersService.addPlayerToSeason(this.teamId, seasonId, p.id));
        }

        // 2. Promote candidates to season
        for (const c of candidates) {
          await firstValueFrom(this.candidatesService.promoteCandidate(this.teamId, c.id, seasonId));
        }

        void this.loadPlayers(this.teamId, seasonId);
      } catch {
        this.errorMessage.set('Failed to update season roster.');
      } finally {
        this.isLoading.set(false);
      }
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
