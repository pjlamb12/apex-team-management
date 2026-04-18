import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonText,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonListHeader,
  IonNote,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  settingsOutline,
  trashOutline,
  addOutline,
  pencilOutline,
  calendarOutline,
  locationOutline,
  shirtOutline,
} from 'ionicons/icons';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { PlayersService, PlayerEntity, CreatePlayerDto, UpdatePlayerDto } from '../players.service';
import { GamesService, GameEntity } from '../games/games.service';
import { PlayerModal } from '../player-modal/player-modal';
import { CommonModule } from '@angular/common';

interface Sport {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  sport: Sport;
}

@Component({
  selector: 'app-team-dashboard',
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
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonText,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonSegment,
    IonSegmentButton,
    IonListHeader,
    IonNote,
  ],
  templateUrl: './team-dashboard.html',
  styleUrl: './team-dashboard.scss',
})
export class TeamDashboard implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly playersService = inject(PlayersService);
  private readonly gamesService = inject(GamesService);

  protected team = signal<Team | null>(null);
  protected players = signal<PlayerEntity[]>([]);
  protected games = signal<GameEntity[]>([]);
  protected selectedSegment = signal<'roster' | 'games'>('roster');
  protected isLoading = signal(false);
  protected gamesLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected upcomingGames = computed(() => {
    const now = new Date();
    return this.games()
      .filter((g) => new Date(g.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  });

  protected pastGames = computed(() => {
    const now = new Date();
    return this.games()
      .filter((g) => new Date(g.scheduledAt) < now)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  });

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);

  constructor() {
    addIcons({
      settingsOutline,
      trashOutline,
      addOutline,
      pencilOutline,
      calendarOutline,
      locationOutline,
      shirtOutline,
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.loadDashboard(id);
    }
  }

  protected async loadDashboard(teamId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [team, players] = await Promise.all([
        firstValueFrom(this.http.get<Team>(`${this.apiUrl}/teams/${teamId}`)),
        firstValueFrom(this.playersService.getPlayers(teamId)),
      ]);
      this.team.set(team);
      this.players.set(players);
    } catch {
      this.errorMessage.set('Failed to load team data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async onSegmentChange(event: any): Promise<void> {
    const value = event.detail.value as 'roster' | 'games';
    this.selectedSegment.set(value);
    if (value === 'games' && this.games().length === 0) {
      await this.loadGames();
    }
  }

  protected async loadGames(): Promise<void> {
    this.gamesLoading.set(true);
    try {
      const games = await firstValueFrom(this.gamesService.getGames(this.teamId));
      this.games.set(games);
    } catch {
      this.errorMessage.set('Failed to load games. Please try again.');
    } finally {
      this.gamesLoading.set(false);
    }
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

  protected async deleteGame(game: GameEntity): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Game?',
      message: `Are you sure you want to delete the game against ${game.opponent}?`,
      buttons: [
        'Cancel',
        {
          text: 'Delete',
          role: 'confirm',
          handler: async () => {
            try {
              await firstValueFrom(this.gamesService.deleteGame(game.id));
              this.games.update((list) => list.filter((g) => g.id !== game.id));
            } catch {
              this.errorMessage.set('Failed to delete game. Please try again.');
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

    const teamId = this.teamId;
    if (!teamId) return;

    try {
      if (player?.id) {
        const updated = await firstValueFrom(
          this.playersService.updatePlayer(teamId, player.id, data as UpdatePlayerDto)
        );
        this.players.update((list) =>
          list.map((p) => (p.id === player.id ? updated : p))
        );
      } else {
        const created = await firstValueFrom(
          this.playersService.addPlayer(teamId, data as CreatePlayerDto)
        );
        this.players.update((list) => [...list, created]);
      }
    } catch {
      this.errorMessage.set('Failed to save player. Please try again.');
    }
  }

  protected get teamId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }
}
