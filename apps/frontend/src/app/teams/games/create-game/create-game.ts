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
import { GamesService } from '../games.service';

@Component({
  selector: 'app-create-game',
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
  templateUrl: './create-game.html',
  styleUrl: './create-game.scss',
})
export class CreateGame implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly gamesService = inject(GamesService);
  protected readonly fb = inject(FormBuilder);

  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    opponent: ['', [Validators.required, Validators.minLength(2)]],
    scheduledAt: [new Date().toISOString(), [Validators.required]],
    location: [''],
    uniformColor: [''],
  });

  ngOnInit(): void {
    // Team ID is in the route: /teams/:id/games/new
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const teamId = this.route.snapshot.paramMap.get('id');
    if (!teamId) {
      this.errorMessage.set('Missing team ID.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const { opponent, scheduledAt, location, uniformColor } = this.form.getRawValue();
      const game = await firstValueFrom(
        this.gamesService.createGame(teamId, {
          opponent: opponent!,
          scheduledAt: scheduledAt!,
          location: location || undefined,
          uniformColor: uniformColor || undefined,
        })
      );
      // Navigate to lineup editor for the new game
      await this.router.navigate(['/teams', teamId, 'games', game.id, 'lineup']);
    } catch {
      this.errorMessage.set('Failed to create game. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
