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
import { EventsService, LocationEntity, LocationService } from '@apex-team/client/data-access/team';
import { LocationModal } from '@apex-team/client/ui/location-modal';
import { Season } from '@apex-team/shared/util/models';

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
  private readonly modalCtrl = inject(ModalController);
  protected readonly fb = inject(FormBuilder);

  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected activeSeason = signal<Season | null>(null);
  
  protected locations = signal<LocationEntity[]>([]);

  protected form = this.fb.group({
    opponent: ['', [Validators.required, Validators.minLength(2)]],
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

    // Reactively update location and color based on isHomeGame toggle
    this.form.get('isHomeGame')?.valueChanges.subscribe((isHome) => {
      this.applySeasonDefaults(isHome ?? true);
    });
  }

  protected async loadSeason(teamId: string): Promise<void> {
    try {
      const season = await firstValueFrom(this.eventsService.getActiveSeason(teamId));
      this.activeSeason.set(season);
      this.applySeasonDefaults(this.form.value.isHomeGame ?? true);
    } catch {
      console.warn('Failed to load active season for defaults');
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

  private applySeasonDefaults(isHome: boolean): void {
    const season = this.activeSeason();
    if (!season) return;

    const patches: any = {
      periodCount: season.periodCount || 2,
      periodLengthMinutes: season.periodLengthMinutes || 45,
      playersOnField: season.playersOnField || 11,
    };

    if (isHome) {
      patches.uniformColor = season.defaultHomeColor ?? '';
    } else {
      patches.uniformColor = season.defaultAwayColor ?? '';
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
        opponent, scheduledAt, locationId, locationName, uniformColor, 
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
