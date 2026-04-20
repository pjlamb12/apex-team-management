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
} from '@ionic/angular/standalone';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { EventsService } from '../events.service';

function toLocalISOString(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

@Component({
  selector: 'app-create-practice',
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
  protected readonly fb = inject(FormBuilder);

  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    scheduledAt: [toLocalISOString(new Date()), [Validators.required]],
    location: [''],
    durationMinutes: [60, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  constructor() {
    // Load season defaults whenever teamId changes
    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadSeasonDefaults(id);
      }
    });
  }

  private async loadSeasonDefaults(teamId: string): Promise<void> {
    try {
      const season = await firstValueFrom(this.eventsService.getActiveSeason(teamId));
      if (season.defaultPracticeLocation) {
        this.form.patchValue({ location: season.defaultPracticeLocation });
      }
    } catch {
      console.warn('Failed to load season defaults for practice');
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
      const { scheduledAt, location, durationMinutes, notes } = this.form.getRawValue();
      await firstValueFrom(
        this.eventsService.createEvent(teamId, {
          type: 'practice',
          scheduledAt: new Date(scheduledAt!).toISOString(),
          location: location || undefined,
          durationMinutes: durationMinutes!,
          notes: notes || undefined,
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
