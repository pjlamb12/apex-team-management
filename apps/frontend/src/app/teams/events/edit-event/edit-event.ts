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
} from '@ionic/angular/standalone';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { EventsService, EventEntity } from '../events.service';

function toLocalISOString(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('Z', '');
}

@Component({
  selector: 'app-edit-event',
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

  private _teamId = signal<string | null>(null);
  private _eventId = signal<string | null>(null);

  public get teamId(): string {
    return this._teamId() ?? '';
  }
  public get eventId(): string {
    return this._eventId() ?? '';
  }

  private readonly router = inject(Router);
  private readonly eventsService = inject(EventsService);
  protected readonly fb = inject(FormBuilder);

  constructor() {
    // Load event whenever teamId or eventId changes
    effect(() => {
      const tId = this._teamId();
      const eId = this._eventId();
      if (tId && eId) {
        void this.loadEvent(tId, eId);
      }
    });
  }

  protected event = signal<EventEntity | null>(null);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    opponent: ['', [Validators.required, Validators.minLength(2)]],
    scheduledAt: ['', [Validators.required]],
    location: [''],
    uniformColor: [''],
    durationMinutes: [null as number | null, [Validators.min(1)]],
    notes: [''],
    goalsFor: [null as number | null, [Validators.min(0)]],
    goalsAgainst: [null as number | null, [Validators.min(0)]],
  });

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
        scheduledAt: toLocalISOString(new Date(data.scheduledAt)),
        location: data.location ?? '',
        uniformColor: data.uniformColor ?? '',
        durationMinutes: data.durationMinutes ?? null,
        notes: data.notes ?? '',
        goalsFor: goalsFor,
        goalsAgainst: data.goalsAgainst ?? null,
      });
      
      if (data.type === 'practice') {
        this.form.get('opponent')?.clearValidators();
        this.form.get('opponent')?.updateValueAndValidity();
      } else {
        this.form.get('opponent')?.setValidators([Validators.required, Validators.minLength(2)]);
        this.form.get('opponent')?.updateValueAndValidity();
      }
    } catch {
      this.errorMessage.set('Failed to load event. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const teamId = this.teamId;
    const eventId = this.eventId;
    if (!teamId || !eventId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const { opponent, scheduledAt, location, uniformColor, durationMinutes, notes, goalsFor, goalsAgainst } = this.form.getRawValue();
      await firstValueFrom(
        this.eventsService.updateEvent(teamId, eventId, {
          opponent: opponent || undefined,
          scheduledAt: new Date(scheduledAt!).toISOString(),
          location: location || undefined,
          uniformColor: uniformColor || undefined,
          durationMinutes: durationMinutes || undefined,
          notes: notes || undefined,
          goalsFor: goalsFor,
          goalsAgainst: goalsAgainst,
        })
      );
      // Navigate back to schedule
      await this.router.navigate(['/teams', teamId, 'schedule']);
    } catch {
      this.errorMessage.set('Failed to update event. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
