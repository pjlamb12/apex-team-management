import { Component, inject, signal, effect, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonNote,
  IonSpinner,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSegment,
  IonSegmentButton,
  AlertController,
  IonRouterLink,
  IonFab,
  IonFabButton,
  IonSelect,
  IonSelectOption,
  ActionSheetController,
  IonBadge,
  IonButton,
  ModalController,
  IonListHeader,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  fitnessOutline,
  locationOutline,
  trashOutline,
  chevronForwardOutline,
  pencilOutline,
  addOutline,
  refreshOutline,
  sunnyOutline,
  megaphoneOutline,
  addCircleOutline,
  trophyOutline,
  buildOutline,
} from 'ionicons/icons';
import { EventsService, EventEntity, SeasonsService, LeaguesService } from '@apex-team/client/data-access/team';
import { Season, League } from '@apex-team/shared/util/models';

interface GroupedEvents {
  leagueName: string;
  events: EventEntity[];
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    RouterLink,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonNote,
    IonSpinner,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonSegment,
    IonSegmentButton,
    IonRouterLink,
    IonFab,
    IonFabButton,
    IonSelect,
    IonSelectOption,
    IonBadge,
    IonButton,
    IonListHeader,
  ],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss',
})
export class Schedule {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  public get teamId(): string {
    return this._teamId() ?? '';
  }

  private readonly eventsService = inject(EventsService);
  private readonly seasonsService = inject(SeasonsService);
  private readonly leaguesService = inject(LeaguesService);
  private readonly alertCtrl = inject(AlertController);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly modalCtrl = inject(ModalController);
  private readonly router = inject(Router);

  protected events = signal<EventEntity[]>([]);
  protected seasons = this.seasonsService.seasons;
  protected selectedSeasonId = this.seasonsService.selectedSeasonId;
  
  protected leagues = signal<League[]>([]);
  protected selectedLeagueId = signal<string | null>(null);

  protected isLoading = signal(false);
  protected isLoadingSeasons = signal(false);
  protected scope = signal<'upcoming' | 'past'>('upcoming');
  private readonly refreshTrigger = signal(0);

  protected groupedEvents = computed<GroupedEvents[]>(() => {
    const allEvents = this.events();
    const leagues = this.leagues();
    const selectedLeagueId = this.selectedLeagueId();

    if (selectedLeagueId) {
      const league = leagues.find(l => l.id === selectedLeagueId);
      return [{
        leagueName: league?.name ?? 'Selected Competition',
        events: allEvents
      }];
    }

    // Group by league
    const groups: Record<string, EventEntity[]> = {};
    const unassigned: EventEntity[] = [];

    allEvents.forEach(event => {
      if (event.leagueId) {
        const league = leagues.find(l => l.id === event.leagueId);
        const name = league?.name ?? 'Other Competition';
        if (!groups[name]) groups[name] = [];
        groups[name].push(event);
      } else {
        unassigned.push(event);
      }
    });

    const result: GroupedEvents[] = Object.entries(groups).map(([name, events]) => ({
      leagueName: name,
      events
    }));

    if (unassigned.length > 0) {
      result.push({
        leagueName: 'Practices & Tryouts',
        events: unassigned
      });
    }

    return result;
  });

  constructor() {
    addIcons({
      calendarOutline,
      fitnessOutline,
      locationOutline,
      trashOutline,
      chevronForwardOutline,
      pencilOutline,
      addOutline,
      refreshOutline,
      sunnyOutline,
      megaphoneOutline,
      addCircleOutline,
      trophyOutline,
      buildOutline,
    });

    // Load events whenever teamId, scope, selectedSeasonId, selectedLeagueId, or refreshTrigger changes
    effect(() => {
      this.refreshTrigger(); // Track refresh trigger
      const id = this._teamId();
      const s = this.scope();
      const seasonId = this.selectedSeasonId();
      const leagueId = this.selectedLeagueId();
      if (id && seasonId) {
        void this.loadEvents(id, s, seasonId, leagueId ?? undefined);
      }
    });

    // Load leagues whenever season changes
    effect(() => {
      const seasonId = this.selectedSeasonId();
      if (seasonId) {
        void this.loadLeagues(seasonId);
      } else {
        this.leagues.set([]);
      }
    });
  }

  ionViewWillEnter(): void {
    const id = this._teamId();
    if (id) {
      void this.loadSeasons(id);
    }
  }

  protected onScopeChange(event: any): void {
    const value = event.detail.value as 'upcoming' | 'past';
    this.scope.set(value);
  }

  protected onSeasonChange(event: any): void {
    this.seasonsService.selectedSeasonId.set(event.detail.value);
    this.selectedLeagueId.set(null); // Reset league filter when season changes
  }

  protected onLeagueChange(event: any): void {
    this.selectedLeagueId.set(event.detail.value);
  }

  protected async presentSeasonModal(season?: Season): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: (await import('./season-modal/season-modal')).SeasonModal,
      componentProps: { season }
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      if (season) {
        await firstValueFrom(this.seasonsService.update(season.id, data));
      } else {
        await firstValueFrom(this.seasonsService.create(this.teamId, data));
      }
      void this.loadSeasons(this.teamId);
    }
  }

  protected async presentLeagueModal(league?: League): Promise<void> {
    const seasonId = this.selectedSeasonId();
    if (!seasonId) return;

    const modal = await this.modalCtrl.create({
      component: (await import('./league-modal/league-modal')).LeagueModal,
      componentProps: { league }
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      if (league) {
        await firstValueFrom(this.leaguesService.update(league.id, data));
      } else {
        await firstValueFrom(this.leaguesService.create(seasonId, data));
      }
      void this.loadLeagues(seasonId);
    }
  }

  protected async manageLeagues(): Promise<void> {
    const seasonId = this.selectedSeasonId();
    if (!seasonId) return;

    const sheet = await this.actionSheetCtrl.create({
      header: 'Manage Competitions',
      buttons: [
        {
          text: 'Add New League / Tournament',
          icon: 'add-outline',
          handler: () => {
            void this.presentLeagueModal();
          }
        },
        ...this.leagues().map(league => ({
          text: `Edit "${league.name}"`,
          icon: 'pencil-outline',
          handler: () => {
            void this.presentLeagueModal(league);
          }
        })),
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  protected async loadSeasons(teamId: string): Promise<void> {
    this.isLoadingSeasons.set(true);
    try {
      await this.seasonsService.initialize(teamId);
    } catch (err) {
      console.error('Failed to load seasons', err);
    } finally {
      this.isLoadingSeasons.set(false);
    }
  }

  protected async loadLeagues(seasonId: string): Promise<void> {
    try {
      const data = await firstValueFrom(this.leaguesService.findAllForSeason(seasonId));
      this.leagues.set(data);
    } catch (err) {
      console.error('Failed to load leagues', err);
    }
  }

  protected async loadEvents(
    teamId: string,
    scope: 'upcoming' | 'past',
    seasonId: string,
    leagueId?: string
  ): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.eventsService.getEvents(teamId, scope, seasonId)
      );
      
      // Filter by league if selected
      if (leagueId) {
        this.events.set(data.filter(e => e.leagueId === leagueId));
      } else {
        this.events.set(data);
      }
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async refreshWeather(event: EventEntity): Promise<void> {
    const teamId = this.teamId;
    if (!teamId || !event.id) return;

    try {
      const weatherData = await firstValueFrom(this.eventsService.refreshWeather(teamId, event.id));
      this.events.update(list => list.map(e => 
        (e.id === event.id || e.virtualId === event.virtualId) 
          ? { ...e, weatherData } 
          : e
      ));
    } catch (err) {
      console.error('Failed to refresh weather', err);
    }
  }

  protected async deleteEvent(event: EventEntity): Promise<void> {
    const teamId = this.teamId;
    if (!teamId) return;

    if (event.recurrenceRule) {
      const alert = await this.alertCtrl.create({
        header: 'Delete Recurring Event',
        message: 'Do you want to delete just this instance or the entire series?',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Just This Instance',
            handler: async () => {
              try {
                await firstValueFrom(this.eventsService.deleteEvent(teamId, event.id));
                this.refreshTrigger.update(n => n + 1);
              } catch {
                console.error('Failed to delete instance');
              }
            }
          },
          {
            text: 'Entire Series',
            role: 'confirm',
            handler: async () => {
              try {
                const masterId = event.parentEventId || event.id;
                await firstValueFrom(this.eventsService.deleteEvent(teamId, masterId));
                this.refreshTrigger.update(n => n + 1);
              } catch {
                console.error('Failed to delete series');
              }
            }
          }
        ]
      });
      await alert.present();
    } else {
      const alert = await this.alertCtrl.create({
        header: 'Delete Event?',
        message: `Are you sure you want to delete this ${event.type}?`,
        buttons: [
          'Cancel',
          {
            text: 'Delete',
            role: 'confirm',
            handler: async () => {
              try {
                await firstValueFrom(this.eventsService.deleteEvent(teamId, event.id));
                this.events.update((list) => list.filter((e) => (e.virtualId || e.id) !== (event.virtualId || event.id)));
              } catch {
                console.error('Failed to delete event');
              }
            },
          },
        ],
      });
      await alert.present();
    }
  }

  protected getEventTitle(event: EventEntity): string {
    if (event.type === 'practice') return 'Practice';
    if (event.type === 'tryout') return 'Tryout Session';
    return `vs ${event.opponent}`;
  }

  protected getEventIcon(event: EventEntity): string {
    if (event.type === 'tryout') return 'megaphone-outline';
    return event.type === 'game' ? 'calendar-outline' : 'fitness-outline';
  }

  protected getEventLink(event: EventEntity): any[] {
    const teamId = this.teamId;
    const path = [];
    if (event.type === 'practice') {
      path.push('/teams', teamId, 'events', event.id, 'practice');
    } else if (event.type === 'tryout') {
      path.push('/teams', teamId, 'events', event.id, 'tryout');
    } else if (event.status === 'completed' || event.status === 'in_progress') {
      path.push('/teams', teamId, 'events', event.id, 'summary');
    } else {
      path.push('/teams', teamId, 'events', event.id, 'lineup');
    }
    
    return path;
  }

  protected getEventEditLink(event: EventEntity): any[] {
    const link = ['/teams', this.teamId, 'schedule', event.id, 'edit'];
    return link;
  }

  protected async presentAddEventSheet(): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      cssClass: 'schedule-action-sheet',
      header: 'Add to Schedule',
      buttons: [
        {
          text: 'Schedule Game',
          icon: 'calendar-outline',
          handler: () => {
            void this.router.navigate(['/teams', this.teamId, 'schedule', 'new']);
          },
        },
        {
          text: 'Schedule Practice',
          icon: 'fitness-outline',
          handler: () => {
            void this.router.navigate(['/teams', this.teamId, 'schedule', 'new-practice']);
          },
        },
        {
          text: 'Schedule Tryout',
          icon: 'megaphone-outline',
          handler: () => {
            void this.router.navigate(['/teams', this.teamId, 'schedule', 'new-tryout']);
          },
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }
}
