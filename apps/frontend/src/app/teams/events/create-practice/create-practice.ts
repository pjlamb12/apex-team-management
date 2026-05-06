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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { EventsService, LocationEntity, LocationService } from '@apex-team/client/data-access/team';
import { LocationModal } from '@apex-team/client/ui/location-modal';

function toLocalISOString(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

@Component({
  selector: 'app-create-practice',
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
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonIcon,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './create-practice.html',
})
export class CreatePractice {
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

  protected locations = signal<LocationEntity[]>([]);

  protected form = this.fb.group({
    scheduledAt: [toLocalISOString(new Date()), [Validators.required]],
    locationId: [''],
    locationName: [''],
    durationMinutes: [60, [Validators.required, Validators.min(1)]],
    notes: [''],
    repeat: ['none'],
  });

  constructor() {
    addIcons({ addOutline });

    // Load data whenever teamId changes
    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadSeasonDefaults(id);
        void this.loadLocations(id);
      }
    });
  }

  private async loadSeasonDefaults(teamId: string): Promise<void> {
    try {
      const season = await firstValueFrom(this.eventsService.getActiveSeason(teamId));
      if (season.defaultPracticeLocation) {
        this.form.patchValue({ locationName: season.defaultPracticeLocation });
      }
    } catch {
      console.warn('Failed to load season defaults for practice');
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
      const { scheduledAt, locationId, locationName, durationMinutes, notes, repeat } = this.form.getRawValue();

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
          type: 'practice',
          scheduledAt: new Date(scheduledAt!).toISOString(),
          location: locationName || undefined,
          locationId: locationId || undefined,
          durationMinutes: durationMinutes!,
          notes: notes || undefined,
          recurrenceRule,
        })
      );
      await this.router.navigate(['/teams', teamId, 'schedule']);
    } catch {
      this.errorMessage.set('Failed to create practice. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
