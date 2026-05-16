import { Component, inject, signal, effect, Input } from '@angular/core';
import { Router } from '@angular/router';
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
  IonList,
  IonSpinner,
  IonIcon,
  IonTextarea,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, megaphoneOutline } from 'ionicons/icons';
import { EventsService, LocationEntity, LocationService } from '@apex-team/client/data-access/team';
import { LocationModal } from '@apex-team/client/ui/location-modal';
import { Season } from '@apex-team/shared/util/models';

function toLocalISOString(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

@Component({
  selector: 'app-create-tryout',
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
    IonList,
    IonSpinner,
    IonIcon,
    IonTextarea,
  ],
  templateUrl: './create-tryout.html',
  styleUrl: './create-tryout.scss',
})
export class CreateTryout {
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
    scheduledAt: [toLocalISOString(new Date()), [Validators.required]],
    locationId: [''],
    locationName: [''],
    durationMinutes: [90, [Validators.required, Validators.min(15)]],
    notes: [''],
  });

  constructor() {
    addIcons({ addOutline, megaphoneOutline });

    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadSeason(id);
        void this.loadLocations(id);
      }
    });
  }

  protected async loadSeason(teamId: string): Promise<void> {
    try {
      const season = await firstValueFrom(this.eventsService.getActiveSeason(teamId));
      this.activeSeason.set(season);
      if (season.defaultPracticeLocation) {
        this.form.patchValue({ locationName: season.defaultPracticeLocation });
      }
    } catch {
      console.warn('Failed to load active season');
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
    const modal = await this.modalCtrl.create({
      component: LocationModal,
      componentProps: { teamId: this.teamId }
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
      const { scheduledAt, locationId, locationName, durationMinutes, notes } = this.form.getRawValue();

      await firstValueFrom(
        this.eventsService.createEvent(teamId, {
          type: 'tryout',
          scheduledAt: new Date(scheduledAt!).toISOString(),
          location: locationName || undefined,
          locationId: locationId || undefined,
          durationMinutes: Number(durationMinutes),
          notes: notes || undefined,
        })
      );
      await this.router.navigate(['/teams', teamId, 'schedule']);
    } catch {
      this.errorMessage.set('Failed to create tryout. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
