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
import { Season } from '@apex-team/shared/util/models';

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
  styleUrl: './create-practice.scss',
})
export class CreatePractice implements OnInit {
  private readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);
  private readonly eventsService = inject(EventsService);
  protected readonly fb = inject(FormBuilder);

  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    scheduledAt: [new Date().toISOString(), [Validators.required]],
    location: [''],
    durationMinutes: [60, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  ngOnInit(): void {
    const teamId = this.route.snapshot.paramMap.get('id');
    if (teamId) {
      void this.loadSeasonDefaults(teamId);
    }
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

    const teamId = this.route.snapshot.paramMap.get('id');
    if (!teamId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const { scheduledAt, location, durationMinutes, notes } = this.form.getRawValue();
      await firstValueFrom(
        this.eventsService.createEvent(teamId, {
          type: 'practice',
          scheduledAt: scheduledAt!,
          location: location || undefined,
          durationMinutes: durationMinutes!,
          notes: notes || undefined,
        })
      );
      await this.router.navigate(['/teams', teamId]);
    } catch {
      this.errorMessage.set('Failed to create practice. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
