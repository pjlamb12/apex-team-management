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
import { GamesService, GameEntity } from '../games.service';

@Component({
  selector: 'app-edit-game',
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
  templateUrl: './edit-game.html',
  styleUrl: './edit-game.scss',
})
export class EditGame implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly gamesService = inject(GamesService);
  protected readonly fb = inject(FormBuilder);

  protected game = signal<GameEntity | null>(null);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    opponent: ['', [Validators.required, Validators.minLength(2)]],
    scheduledAt: ['', [Validators.required]],
    location: [''],
    uniformColor: [''],
  });

  ngOnInit(): void {
    const gameId = this.route.snapshot.paramMap.get('gameId');
    if (gameId) {
      void this.loadGame(gameId);
    }
  }

  protected async loadGame(gameId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await firstValueFrom(this.gamesService.getGame(gameId));
      this.game.set(data);
      this.form.patchValue({
        opponent: data.opponent,
        scheduledAt: data.scheduledAt,
        location: data.location ?? '',
        uniformColor: data.uniformColor ?? '',
      });
    } catch {
      this.errorMessage.set('Failed to load game. Please try again.');
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
    const gameId = this.route.snapshot.paramMap.get('gameId');
    if (!teamId || !gameId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const { opponent, scheduledAt, location, uniformColor } = this.form.getRawValue();
      await firstValueFrom(
        this.gamesService.updateGame(gameId, {
          opponent: opponent!,
          scheduledAt: scheduledAt!,
          location: location || undefined,
          uniformColor: uniformColor || undefined,
        })
      );
      // Navigate back to team dashboard
      await this.router.navigate(['/teams', teamId]);
    } catch {
      this.errorMessage.set('Failed to update game. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
