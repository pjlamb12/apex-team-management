import { Component, inject, signal, effect, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonButtons,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  trashOutline,
  createOutline,
  calendarOutline,
  chevronUpOutline,
  chevronDownOutline,
  trophyOutline,
} from 'ionicons/icons';
import { SeasonsService, LeaguesService } from '@apex-team/client/data-access/team';
import { Season, League } from '@apex-team/shared/util/models';
import { LeagueModal } from '../../events/schedule/league-modal/league-modal';

interface SeasonWithLeagues extends Season {
  leagues: League[];
  isExpanded?: boolean;
}

@Component({
  selector: 'app-seasons-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonButton,
    IonButtons,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonText,
    DatePipe,
  ],
  templateUrl: './seasons-list.html',
  styleUrl: './seasons-list.scss',
})
export class SeasonsList {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  public get teamId(): string {
    return this._teamId() ?? '';
  }

  private readonly seasonsService = inject(SeasonsService);
  private readonly leaguesService = inject(LeaguesService);
  protected readonly alertCtrl = inject(AlertController);
  protected readonly modalCtrl = inject(ModalController);

  protected seasons = signal<SeasonWithLeagues[]>([]);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({
      addOutline,
      trashOutline,
      createOutline,
      calendarOutline,
      chevronUpOutline,
      chevronDownOutline,
      trophyOutline,
    });

    // Load seasons whenever teamId changes
    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadSeasons(id);
      }
    });
  }

  protected async loadSeasons(teamId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await firstValueFrom(this.seasonsService.findAllForTeam(teamId));
      
      const seasonsWithLeagues: SeasonWithLeagues[] = await Promise.all(
        data.map(async (season) => {
          try {
            const leagues = await firstValueFrom(this.leaguesService.findAllForSeason(season.id));
            return { ...season, leagues, isExpanded: true };
          } catch {
            return { ...season, leagues: [], isExpanded: true };
          }
        })
      );

      this.seasons.set(seasonsWithLeagues);
    } catch {
      this.errorMessage.set('Failed to load seasons. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async confirmDelete(season: Season): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Season',
      message: `Are you sure you want to delete ${season.name}? This will delete all matches and data associated with it. This cannot be undone.`,
      buttons: [
        { text: 'Keep Season', role: 'cancel' },
        {
          text: 'Delete Season',
          role: 'destructive',
          cssClass: 'text-danger',
          handler: () => {
            void this.deleteSeason(season.id);
          },
        },
      ],
    });
    await alert.present();
  }

  private async deleteSeason(id: string): Promise<void> {
    try {
      await firstValueFrom(this.seasonsService.remove(id));
      const teamId = this.teamId;
      if (teamId) {
        await this.loadSeasons(teamId);
      }
    } catch (error: any) {
      const msg = error?.error?.message || 'Failed to delete season. Please try again.';
      this.errorMessage.set(msg);
    }
  }

  protected async addCompetition(season: SeasonWithLeagues): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: LeagueModal,
      componentProps: {
        teamId: this.teamId,
      },
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      try {
        await firstValueFrom(this.leaguesService.create(season.id, data));
        void this.loadSeasons(this.teamId);
      } catch (error: any) {
        const msg = error?.error?.message || 'Failed to create competition. Please try again.';
        this.errorMessage.set(msg);
      }
    }
  }

  protected async editCompetition(season: SeasonWithLeagues, league: League): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: LeagueModal,
      componentProps: {
        league,
        teamId: this.teamId,
      },
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      try {
        await firstValueFrom(this.leaguesService.update(league.id, data));
        void this.loadSeasons(this.teamId);
      } catch (error: any) {
        const msg = error?.error?.message || 'Failed to update competition. Please try again.';
        this.errorMessage.set(msg);
      }
    }
  }

  protected async confirmDeleteCompetition(league: League): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Competition',
      message: `Are you sure you want to delete "${league.name}"? This cannot be undone.`,
      buttons: [
        { text: 'Keep', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            void this.deleteCompetition(league.id);
          },
        },
      ],
    });
    await alert.present();
  }

  private async deleteCompetition(id: string): Promise<void> {
    try {
      await firstValueFrom(this.leaguesService.remove(id));
      const teamId = this.teamId;
      if (teamId) {
        await this.loadSeasons(teamId);
      }
    } catch (error: any) {
      const msg = error?.error?.message || 'Failed to delete competition. Please try again.';
      this.errorMessage.set(msg);
    }
  }
}
