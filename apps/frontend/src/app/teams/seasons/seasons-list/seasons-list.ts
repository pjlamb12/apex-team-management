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
  peopleOutline,
} from 'ionicons/icons';
import { SeasonsService, LeaguesService, PlayersService, SeasonChecklistService } from '@apex-team/client/data-access/team';
import { Season, League, SeasonChecklistItem, SeasonChecklistValue } from '@apex-team/shared/util/models';
import { LeagueModal } from '../../events/schedule/league-modal/league-modal';

interface SeasonWithLeagues extends Season {
  leagues: League[];
  isExpanded?: boolean;
  players?: any[];
  checklistItems?: SeasonChecklistItem[];
  checklistValues?: Record<string, Record<string, string | null>>;
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
  private readonly playersService = inject(PlayersService);
  private readonly checklistService = inject(SeasonChecklistService);
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
      peopleOutline,
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
            const players = await firstValueFrom(this.playersService.getPlayersForSeason(teamId, season.id));
            const checklistItems = await firstValueFrom(this.checklistService.findItems(season.id));
            const checklistValues = await firstValueFrom(this.checklistService.findValues(season.id));

            const valuesMap: Record<string, Record<string, string | null>> = {};
            players.forEach(p => {
              valuesMap[p.id] = {};
              checklistItems.forEach(item => {
                valuesMap[p.id][item.id] = null;
              });
            });
            checklistValues.forEach(val => {
              if (valuesMap[val.playerId]) {
                valuesMap[val.playerId][val.itemId] = val.value;
              }
            });

            return {
              ...season,
              leagues,
              isExpanded: season.isActive,
              players,
              checklistItems,
              checklistValues: valuesMap,
            };
          } catch {
            return {
              ...season,
              leagues: [],
              isExpanded: season.isActive,
              players: [],
              checklistItems: [],
              checklistValues: {},
            };
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
          text: 'Delete',
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

  protected async addChecklistItem(season: SeasonWithLeagues): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Add Tracked Item',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'e.g. Uniform Ordered, Offer Sent',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: async (data) => {
            if (!data.name?.trim()) return;
            try {
              await firstValueFrom(this.checklistService.createItem(season.id, data.name.trim()));
              void this.loadSeasons(this.teamId);
            } catch (error: any) {
              const msg = error?.error?.message || 'Failed to add checklist item.';
              this.errorMessage.set(msg);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  protected async deleteChecklistItem(season: SeasonWithLeagues, itemId: string, itemName: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Tracked Item',
      message: `Are you sure you want to delete "${itemName}"? This will delete all tracking data for this item across all players in this season.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.checklistService.removeItem(season.id, itemId));
              void this.loadSeasons(this.teamId);
            } catch (error: any) {
              const msg = error?.error?.message || 'Failed to delete checklist item.';
              this.errorMessage.set(msg);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  protected async onChecklistValueChange(
    season: SeasonWithLeagues,
    playerId: string,
    itemId: string,
    value: string | null
  ): Promise<void> {
    try {
      const dbValue = value === 'null' || value === '' ? null : value;
      
      if (season.checklistValues && season.checklistValues[playerId]) {
        season.checklistValues[playerId][itemId] = dbValue;
        this.seasons.set([...this.seasons()]);
      }

      await firstValueFrom(this.checklistService.upsertValue(season.id, playerId, itemId, dbValue));
    } catch (error: any) {
      const msg = error?.error?.message || 'Failed to update checklist status.';
      this.errorMessage.set(msg);
      void this.loadSeasons(this.teamId);
    }
  }

  protected async manageGuestPlayers(season: SeasonWithLeagues, league: League): Promise<void> {
    const tId = this.teamId;
    if (!tId || !league.id) return;

    try {
      const guests = await firstValueFrom(this.playersService.getGuestPlayersForLeague(tId, league.id));
      const guestListMsg = guests.length > 0
        ? 'Current guest players:\n' + guests.map(g => `#${g.jerseyNumber ?? '?'} ${g.firstName} ${g.lastName}`).join('\n')
        : 'No guest players assigned to this competition yet.';

      const alert = await this.alertCtrl.create({
        header: `Guest Players: ${league.name}`,
        message: guestListMsg,
        inputs: [
          { name: 'firstName', type: 'text', placeholder: 'First Name' },
          { name: 'lastName', type: 'text', placeholder: 'Last Name' },
          { name: 'jerseyNumber', type: 'number', placeholder: 'Jersey #' },
        ],
        buttons: [
          { text: 'Close', role: 'cancel' },
          {
            text: 'Add Guest',
            handler: (data) => {
              if (!data.firstName || !data.lastName || !data.jerseyNumber) {
                return false;
              }
              void this.addGuestPlayerToLeague(tId, league.id, data.firstName, data.lastName, +data.jerseyNumber);
              return true;
            }
          }
        ]
      });
      await alert.present();
    } catch (err) {
      console.error('Failed to load guest players for competition', err);
    }
  }

  private async addGuestPlayerToLeague(teamId: string, leagueId: string, firstName: string, lastName: string, jerseyNumber: number): Promise<void> {
    try {
      await firstValueFrom(this.playersService.addGuestPlayerToLeague(teamId, leagueId, {
        firstName,
        lastName,
        jerseyNumber,
        isGuest: true,
        leagueId,
      }));
      void this.loadSeasons(teamId);
    } catch (err) {
      console.error('Failed to add guest player to league', err);
    }
  }
}
