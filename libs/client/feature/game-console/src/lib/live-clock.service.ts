import { Injectable, signal, computed } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
   * Initializes the clock for a specific game, restoring persisted elapsed time from backend and localStorage.
   */
  public initialize(
    gameId: string,
    backendClockStartTime?: string | Date | null,
    backendClockAccumulatedMs?: number
  ): void {
    this.gameId = gameId;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.startTime.set(null);
    this.accumulatedMs.set(0);
    this.elapsedMs.set(0);

    // Prioritize backend state if available
    if (backendClockAccumulatedMs !== undefined || backendClockStartTime) {
      this.accumulatedMs.set(backendClockAccumulatedMs || 0);
      if (backendClockStartTime) {
        const parsedStart = new Date(backendClockStartTime).getTime();
        this.startTime.set(parsedStart);
        
        // Start local interval ticks if clock is running on the backend
        this.intervalId = setInterval(() => {
          this.updateElapsed();
        }, 100);
      }
      this.updateElapsed();
      return;
    }

    // Fallback to localStorage
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
   * Synchronizes the local clock from a remote update.
   */
  public syncFromRemote(remoteStartTime: string | Date | null, remoteAccumulatedMs: number): void {
    const parsedStart = remoteStartTime ? new Date(remoteStartTime).getTime() : null;
    
    const currentLocalStart = this.startTime();
    const currentLocalAccumulated = this.accumulatedMs();
    
    const startChanged = currentLocalStart !== parsedStart;
    const accumulatedChanged = Math.abs(currentLocalAccumulated - remoteAccumulatedMs) > 1000;

    if (startChanged || accumulatedChanged) {
      this.accumulatedMs.set(remoteAccumulatedMs);
      this.startTime.set(parsedStart);

      if (parsedStart !== null) {
        if (!this.intervalId) {
          this.intervalId = setInterval(() => {
            this.updateElapsed();
          }, 100);
        }
      } else {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }
      this.updateElapsed();
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
  public async start(): Promise<void> {
    if (this.isRunning()) {
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Ignore haptic errors on web
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
  public async stop(): Promise<void> {
    if (!this.isRunning()) {
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Ignore haptic errors on web
    }

    const now = Date.now();
    const currentStint = now - this.startTime()!;
    const newAccumulated = this.accumulatedMs() + currentStint;

    this.accumulatedMs.set(newAccumulated);
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
  public async reset(): Promise<void> {
    try {
      await Haptics.vibrate();
    } catch (e) {
      // Ignore haptic errors on web
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.startTime.set(null);
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
