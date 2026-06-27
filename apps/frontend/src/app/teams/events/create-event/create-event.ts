import { Component, inject, signal, effect, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonBackButton,
  IonButtons,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonList,
  IonNote,
  IonSpinner,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { EventsService, LocationEntity, LocationService, LeaguesService } from '@apex-team/client/data-access/team';
import { LocationModal } from '@apex-team/client/ui/location-modal';
import { Season, League } from '@apex-team/shared/util/models';

function toLocalISOString(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonBackButton,
    IonButtons,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonLabel,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonList,
    IonNote,
    IonSpinner,
    IonIcon,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './create-event.html',
})
export class CreateEvent {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  public get teamId(): string {
    return this._teamId() ?? '';
  }

  private readonly router = inject(Router);
  private readonly eventsService = inject(EventsService);
  private readonly locationService = inject(LocationService);
  private readonly leaguesService = inject(LeaguesService);
  private readonly modalCtrl = inject(ModalController);
  protected readonly fb = inject(FormBuilder);

  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected activeSeason = signal<Season | null>(null);
  protected leagues = signal<League[]>([]);
  
  protected locations = signal<LocationEntity[]>([]);

  protected form = this.fb.group({
    opponent: ['', [Validators.required, Validators.minLength(2)]],
    leagueId: ['', [Validators.required]],
    scheduledAt: [toLocalISOString(new Date()), [Validators.required]],
    locationId: [''],
    locationName: [''], // Field/Venue name within the location
    uniformColor: [''],
    isHomeGame: [true],
    periodCount: [2, [Validators.min(1)]],
    periodLengthMinutes: [45, [Validators.min(1)]],
    playersOnField: [11, [Validators.min(1)]],
    repeat: ['none'],
  });

  constructor() {
    addIcons({ addOutline });

    // Load data whenever teamId changes
    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadSeason(id);
        void this.loadLocations(id);
      }
    });

    // Load leagues whenever season changes
    effect(() => {
      const season = this.activeSeason();
      if (season) {
        void this.loadLeagues(season.id);
      }
    });

    // Reactively update location and color based on isHomeGame toggle and leagueId selection
    this.form.get('isHomeGame')?.valueChanges.subscribe((isHome) => {
      this.applyLeagueDefaults(isHome ?? true, this.form.value.leagueId ?? '');
    });
    this.form.get('leagueId')?.valueChanges.subscribe((leagueId) => {
      this.applyLeagueDefaults(this.form.value.isHomeGame ?? true, leagueId ?? '');
    });
  }

  ionViewWillEnter(): void {
    this.isSaving.set(false);
    this.errorMessage.set(null);
    this.form.reset({
      opponent: '',
      leagueId: this.leagues().length > 0 ? this.leagues()[0].id : '',
      scheduledAt: toLocalISOString(new Date()),
      locationId: '',
      locationName: '',
      uniformColor: '',
      isHomeGame: true,
      periodCount: 2,
      periodLengthMinutes: 45,
      playersOnField: 11,
      repeat: 'none',
    });
    const id = this._teamId();
    if (id) {
      void this.loadSeason(id);
    }
  }

  protected async loadSeason(teamId: string): Promise<void> {
    try {
      const season = await firstValueFrom(this.eventsService.getActiveSeason(teamId));
      this.activeSeason.set(season);
    } catch {
      console.warn('Failed to load active season for defaults');
    }
  }

  protected async loadLeagues(seasonId: string): Promise<void> {
    try {
      const leagues = await firstValueFrom(this.leaguesService.findAllForSeason(seasonId));
      this.leagues.set(leagues);
      if (leagues.length > 0) {
        const defaultLeagueId = leagues[0].id;
        this.form.patchValue({ leagueId: defaultLeagueId });
        this.applyLeagueDefaults(this.form.value.isHomeGame ?? true, defaultLeagueId);
      }
    } catch {
      console.error('Failed to load leagues');
    }
  }

  protected async loadLocations(teamId: string): Promise<void> {
    try {
      const locs = await firstValueFrom(this.locationService.getLocations(teamId));
      this.locations.set(locs);
    } catch {
      console.error('Failed to load locations');
    }
  }

  protected async presentLocationModal(): Promise<void> {
    const teamId = this.teamId;
    if (!teamId) return;

    const modal = await this.modalCtrl.create({
      component: LocationModal,
      componentProps: { teamId }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      const newLoc = data as LocationEntity;
      this.locations.update(prev => [...prev, newLoc]);
      this.form.patchValue({ locationId: newLoc.id });
    }
  }

  private applyLeagueDefaults(isHome: boolean, leagueId: string): void {
    if (!leagueId) return;
    const league = this.leagues().find((l) => l.id === leagueId);
    if (!league) return;

    const patches: any = {
      periodCount: league.periodCount || 2,
      periodLengthMinutes: league.periodLengthMinutes || 45,
      playersOnField: league.playersOnField || 11,
    };

    if (isHome) {
      patches.uniformColor = league.defaultHomeColor ?? '';
      patches.locationId = league.homeLocationId ?? '';
      patches.locationName = league.defaultHomeVenue ?? '';
    } else {
      patches.uniformColor = league.defaultAwayColor ?? '';
      patches.locationId = '';
      patches.locationName = '';
    }

    this.form.patchValue(patches);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const teamId = this.teamId;
    if (!teamId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const { 
        opponent, leagueId, scheduledAt, locationId, locationName, uniformColor, 
        isHomeGame, periodCount, periodLengthMinutes, playersOnField, repeat 
      } = this.form.getRawValue();

      let recurrenceRule: string | undefined = undefined;
      if (repeat && repeat !== 'none') {
        const date = new Date(scheduledAt!);
        const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const day = days[date.getDay()];
        if (repeat === 'weekly') {
          recurrenceRule = `FREQ=WEEKLY;BYDAY=${day}`;
        } else if (repeat === 'biweekly') {
          recurrenceRule = `FREQ=WEEKLY;INTERVAL=2;BYDAY=${day}`;
        }
      }

      await firstValueFrom(
        this.eventsService.createEvent(teamId, {
          type: 'game',
          opponent: opponent!,
          leagueId: leagueId || undefined,
          scheduledAt: new Date(scheduledAt!).toISOString(),
          location: locationName || undefined,
          locationId: locationId || undefined,
          uniformColor: uniformColor || undefined,
          isHomeGame: isHomeGame ?? true,
          periodCount: periodCount ? Number(periodCount) : undefined,
          periodLengthMinutes: periodLengthMinutes ? Number(periodLengthMinutes) : undefined,
          playersOnField: playersOnField ? Number(playersOnField) : undefined,
          recurrenceRule,
        })
      );
      await this.router.navigate(['/teams', teamId, 'schedule']);
    } catch {
      this.errorMessage.set('Failed to create game. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
