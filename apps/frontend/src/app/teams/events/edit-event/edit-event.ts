import { Component, inject, signal, effect, Input, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
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
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonLabel,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonToggle,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline } from 'ionicons/icons';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { EventsService, EventEntity, LocationService, LocationEntity, LeaguesService } from '@apex-team/client/data-access/team';
import { LocationModal } from '@apex-team/client/ui/location-modal';
import { League } from '@apex-team/shared/util/models';
import { CommonModule } from '@angular/common';

function toLocalISOString(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonLabel,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonToggle,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './edit-event.html',
})
export class EditEvent {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }
  @Input() set eventId(val: string) {
    this._eventId.set(val);
  }

  private readonly _teamId = signal<string | null>(null);
  private readonly _eventId = signal<string | null>(null);

  protected readonly teamId = computed(() => this._teamId() || '');
  protected readonly eventIdSignal = computed(() => this._eventId() || '');

  private readonly router = inject(Router);
  private readonly eventsService = inject(EventsService);
  private readonly locationService = inject(LocationService);
  private readonly leaguesService = inject(LeaguesService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);
  protected readonly fb = inject(FormBuilder);

  protected event = signal<EventEntity | null>(null);
  protected locations = signal<LocationEntity[]>([]);
  protected leagues = signal<League[]>([]);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    opponent: ['', [Validators.required, Validators.minLength(2)]],
    leagueId: ['', [Validators.required]],
    scheduledAt: ['', [Validators.required]],
    locationId: [''],
    locationName: [''],
    uniformColor: [''],
    isHomeGame: [true],
    durationMinutes: [null as number | null, [Validators.min(1)]],
    notes: [''],
    goalsFor: [null as number | null, [Validators.min(0)]],
    goalsAgainst: [null as number | null, [Validators.min(0)]],
    periodCount: [null as number | null, [Validators.min(1)]],
    periodLengthMinutes: [null as number | null, [Validators.min(1)]],
    playersOnField: [null as number | null, [Validators.min(1)]],
  });

  constructor() {
    addIcons({ addOutline, trashOutline });
    // Load event whenever teamId or eventId changes
    effect(() => {
      const tId = this.teamId();
      const eId = this.eventIdSignal();
      if (tId && eId) {
        void this.loadEvent(tId, eId);
        void this.loadLocations(tId);
      }
    });

    // Load leagues whenever event is loaded
    effect(() => {
      const event = this.event();
      if (event) {
        void this.loadLeagues(event.seasonId);
      }
    });
  }

  protected async loadLocations(teamId: string): Promise<void> {
    if (!teamId) return;
    try {
      const locs = await firstValueFrom(this.locationService.getLocations(teamId));
      this.locations.set(locs);
    } catch {
      console.error('Failed to load locations');
    }
  }

  protected async loadLeagues(seasonId: string): Promise<void> {
    try {
      const leagues = await firstValueFrom(this.leaguesService.findAllForSeason(seasonId));
      this.leagues.set(leagues);
    } catch {
      console.error('Failed to load leagues');
    }
  }

  protected async presentLocationModal(): Promise<void> {
    const tId = this.teamId();
    if (!tId) return;

    const modal = await this.modalCtrl.create({
      component: LocationModal,
      componentProps: { teamId: tId }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      const newLoc = data as LocationEntity;
      this.locations.update((prev: LocationEntity[]) => [...prev, newLoc]);
      this.form.patchValue({ locationId: newLoc.id });
    }
  }

  protected async loadEvent(teamId: string, eventId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await firstValueFrom(this.eventsService.getEvent(teamId, eventId));
      this.event.set(data);
      
      let goalsFor = data.goalsFor;
      if (data.status === 'completed' && data.type === 'game' && (goalsFor === null || goalsFor === undefined)) {
        goalsFor = data.goalEventCount ?? 0;
      }

      this.form.patchValue({
        opponent: data.opponent ?? '',
        leagueId: data.leagueId ?? '',
        scheduledAt: toLocalISOString(new Date(data.scheduledAt)),
        locationId: data.locationId ?? '',
        locationName: data.location ?? '',
        uniformColor: data.uniformColor ?? '',
        isHomeGame: data.isHomeGame ?? true,
        durationMinutes: data.durationMinutes ?? null,
        notes: data.notes ?? '',
        goalsFor: goalsFor,
        goalsAgainst: data.goalsAgainst ?? null,
        periodCount: data.periodCount ?? null,
        periodLengthMinutes: data.periodLengthMinutes ?? null,
        playersOnField: data.playersOnField ?? null,
      });
      
      if (data.type === 'practice') {
        this.form.get('opponent')?.clearValidators();
        this.form.get('opponent')?.updateValueAndValidity();
        this.form.get('leagueId')?.clearValidators();
        this.form.get('leagueId')?.updateValueAndValidity();
      } else {
        this.form.get('opponent')?.setValidators([Validators.required, Validators.minLength(2)]);
        this.form.get('opponent')?.updateValueAndValidity();
        this.form.get('leagueId')?.setValidators([Validators.required]);
        this.form.get('leagueId')?.updateValueAndValidity();
      }
    } catch {
      this.errorMessage.set('Failed to load event. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async deleteEvent(): Promise<void> {
    const event = this.event();
    const tId = this.teamId();
    if (!event || !tId) return;

    const alert = await this.alertCtrl.create({
      header: 'Delete Event?',
      message: `Are you sure you want to delete this ${event.type}?`,
      buttons: [
        'Cancel',
        {
          text: 'Delete',
          role: 'confirm',
          cssClass: 'text-red-500',
          handler: async () => {
            try {
              await firstValueFrom(this.eventsService.deleteEvent(tId, event.id));
              await this.router.navigate(['/teams', tId, 'schedule']);
            } catch {
              this.errorMessage.set('Failed to delete event.');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const tId = this.teamId();
    const eId = this.eventIdSignal();
    if (!tId || !eId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const { 
        opponent, leagueId, scheduledAt, locationId, locationName, uniformColor, 
        isHomeGame, durationMinutes, notes, goalsFor, goalsAgainst, 
        periodCount, periodLengthMinutes, playersOnField 
      } = this.form.getRawValue();
      
      await firstValueFrom(
        this.eventsService.updateEvent(tId, eId, {
          opponent: opponent || undefined,
          leagueId: leagueId || undefined,
          scheduledAt: new Date(scheduledAt!).toISOString(),
          location: locationName || undefined,
          locationId: locationId || undefined,
          uniformColor: uniformColor || undefined,
          isHomeGame: isHomeGame ?? true,
          durationMinutes: durationMinutes || undefined,
          notes: notes || undefined,
          goalsFor: goalsFor,
          goalsAgainst: goalsAgainst,
          periodCount: periodCount ? Number(periodCount) : undefined,
          periodLengthMinutes: periodLengthMinutes ? Number(periodLengthMinutes) : undefined,
          playersOnField: playersOnField ? Number(playersOnField) : undefined,
        })
      );
      // Navigate back to schedule
      await this.router.navigate(['/teams', tId, 'schedule']);
    } catch {
      this.errorMessage.set('Failed to update event. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
