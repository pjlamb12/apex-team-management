import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { LiveClockService } from '../live-clock.service';
import { LiveGameStateService } from '../live-game-state.service';
import { ClockDisplay } from '../clock-display/clock-display';

interface GameEntity {
  id: string;
  opponent: string;
  scheduledAt: string;
  location: string | null;
  uniformColor: string | null;
  status: 'scheduled' | 'in_progress' | 'completed';
}

@Component({
  selector: 'app-console-wrapper',
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonSpinner,
    IonText,
    ClockDisplay,
  ],
  templateUrl: './console-wrapper.html',
})
export class ConsoleWrapper implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly clockService = inject(LiveClockService);
  private readonly gameStateService = inject(LiveGameStateService);
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  protected game = signal<GameEntity | null>(null);
  protected teamId = signal<string>('');
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);

  protected readonly isRunning = this.clockService.isRunning;

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  ngOnInit(): void {
    const gameId = this.route.snapshot.paramMap.get('gameId');
    const id = this.route.snapshot.paramMap.get('id');
    if (gameId && id) {
      this.teamId.set(id);
      this.gameStateService.initialize(gameId);
      void this.loadGame(gameId);
    }
  }

  ngOnDestroy(): void {
    this.clockService.stop();
  }

  private async loadGame(gameId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const game = await firstValueFrom(
        this.http.get<GameEntity>(`${this.apiUrl}/games/${gameId}`)
      );
      this.game.set(game);
    } catch (err) {
      console.error('Failed to load game', err);
      this.errorMessage.set('Failed to load game. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onStart(): void {
    this.clockService.start();
  }

  protected onStop(): void {
    this.clockService.stop();
  }

  protected onReset(): void {
    this.clockService.reset();
  }
}
