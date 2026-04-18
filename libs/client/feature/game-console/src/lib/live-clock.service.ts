import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LiveClockService {
  private startTime = signal<number | null>(null);
  private accumulatedMs = signal<number>(0);
  private intervalId: any = null;

  /**
   * Current elapsed time in milliseconds.
   */
  public readonly elapsedMs = signal<number>(0);

  /**
   * Whether the clock is currently running.
   */
  public readonly isRunning = computed(() => this.startTime() !== null);

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
