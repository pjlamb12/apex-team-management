import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
export class EditEvent implements OnInit {
  private readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);
  private readonly eventsService = inject(EventsService);
  protected readonly fb = inject(FormBuilder);

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
  });

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    if (eventId) {
      void this.loadEvent(eventId);
    }
  }

  protected async loadEvent(eventId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const teamId = this.route.snapshot.paramMap.get('id');
      if (!teamId) throw new Error('Missing team ID');
      const data = await firstValueFrom(this.eventsService.getEvent(teamId, eventId));
      this.event.set(data);
      this.form.patchValue({
        opponent: data.opponent ?? '',
        scheduledAt: data.scheduledAt,
        location: data.location ?? '',
        uniformColor: data.uniformColor ?? '',
        durationMinutes: data.durationMinutes ?? null,
        notes: data.notes ?? '',
      });
      
      if (data.type === 'practice') {
        this.form.get('opponent')?.clearValidators();
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
    const teamId = this.route.snapshot.paramMap.get('id');
    const eventId = this.route.snapshot.paramMap.get('eventId');
    if (!teamId || !eventId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const { opponent, scheduledAt, location, uniformColor, durationMinutes, notes } = this.form.getRawValue();
      await firstValueFrom(
        this.eventsService.updateEvent(teamId, eventId, {
          opponent: opponent || undefined,
          scheduledAt: scheduledAt!,
          location: location || undefined,
          uniformColor: uniformColor || undefined,
          durationMinutes: durationMinutes || undefined,
          notes: notes || undefined,
        })
      );
      // Navigate back to team dashboard
      await this.router.navigate(['/teams', teamId]);
    } catch {
      this.errorMessage.set('Failed to update event. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
