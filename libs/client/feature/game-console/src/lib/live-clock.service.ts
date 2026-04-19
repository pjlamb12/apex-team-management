import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LiveClockService {
  private startTime = signal<number | null>(null);
  private accumulatedMs = signal<number>(0);
  private intervalId: any = null;
  private gameId: string | null = null;

  /**
   * Current elapsed time in milliseconds.
   */
  public readonly elapsedMs = signal<number>(0);

  /**
   * Current 1-indexed minute of the game.
   */
  public readonly currentMinute = computed(() => {
    const elapsedMs = this.elapsedMs();
    return Math.floor(elapsedMs / 60000) + 1;
  });

  /**
   * Whether the clock is currently running.
   */
  public readonly isRunning = computed(() => this.startTime() !== null);

  /**
   * Initializes the clock for a specific game, restoring persisted elapsed time from localStorage.
   */
  public initialize(gameId: string): void {
    this.gameId = gameId;
    const stored = localStorage.getItem(`apex_clock_${gameId}`);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.accumulatedMs.set(parsed);
        this.updateElapsed();
      }
    }
  }

  /**
   * Persists the current accumulatedMs to localStorage under the game-scoped key.
   */
  private persistClock(): void {
    if (this.gameId) {
      localStorage.setItem(`apex_clock_${this.gameId}`, String(this.accumulatedMs()));
    }
  }

  /**
   * Starts the clock from its current elapsed time.
   */
  public start(): void {
    if (this.isRunning()) {
      return;
    }

    const now = Date.now();
    this.startTime.set(now);

    this.intervalId = setInterval(() => {
      this.updateElapsed();
    }, 100); // Update every 100ms for responsiveness
  }

  /**
   * Stops the clock and accumulates elapsed time.
   */
  public stop(): void {
    if (!this.isRunning()) {
      return;
    }

    this.accumulatedMs.update((total) => total + (Date.now() - this.startTime()!));
    this.persistClock();
    this.startTime.set(null);

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.updateElapsed();
  }

  /**
   * Resets the clock to zero and stops it.
   */
  public reset(): void {
    this.stop();
    this.accumulatedMs.set(0);
    this.elapsedMs.set(0);
    this.persistClock();
  }

  private updateElapsed(): void {
    if (this.isRunning()) {
      const currentElapsed = Date.now() - this.startTime()!;
      this.elapsedMs.set(this.accumulatedMs() + currentElapsed);
    } else {
      this.elapsedMs.set(this.accumulatedMs());
    }
  }
}
