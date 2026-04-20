import { Component, inject, signal, effect, Input } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { EventsService } from '../events.service';
import { Season } from '@apex-team/shared/util/models';

function toLocalISOString(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
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
  protected readonly fb = inject(FormBuilder);

  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected activeSeason = signal<Season | null>(null);

  protected form = this.fb.group({
    opponent: ['', [Validators.required, Validators.minLength(2)]],
    scheduledAt: [toLocalISOString(new Date()), [Validators.required]],
    location: [''],
    uniformColor: [''],
    isHomeGame: [true],
  });

  constructor() {
    // Load season whenever teamId changes
    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadSeason(id);
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

  private applySeasonDefaults(isHome: boolean): void {
    const season = this.activeSeason();
    if (!season) return;

    if (isHome) {
      this.form.patchValue({
        location: season.defaultHomeVenue ?? '',
        uniformColor: season.defaultHomeColor ?? '',
      });
    } else {
      this.form.patchValue({
        uniformColor: season.defaultAwayColor ?? '',
      });
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const teamId = this.teamId;
    if (!teamId) {
      this.errorMessage.set('Missing team ID.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const { opponent, scheduledAt, location, uniformColor, isHomeGame } =
        this.form.getRawValue();
      const event = await firstValueFrom(
        this.eventsService.createEvent(teamId, {
          type: 'game',
          opponent: opponent!,
          scheduledAt: new Date(scheduledAt!).toISOString(),
          location: location || undefined,
          uniformColor: uniformColor || undefined,
          isHomeGame: isHomeGame ?? true,
        })
      );
      // Navigate back to schedule
      await this.router.navigate(['/teams', teamId, 'schedule']);
    } catch {
      this.errorMessage.set('Failed to create game. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
