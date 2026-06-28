import { Injectable, signal, computed, effect } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { PracticeDrill } from './drill.model';

export interface PacerState {
  activeDrillIndex: number;
  remainingSeconds: number;
  isRunning: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PracticePacerService {
  private _drills = signal<PracticeDrill[]>([]);
  private _activeDrillIndex = signal<number>(0);
  private _startTime = signal<number | null>(null);
  private _accumulatedMs = signal<number>(0);
  private _elapsedMs = signal<number>(0);
  private _isRunning = signal<boolean>(false);
  private _practiceId: string | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastAlertedSecond: number | null = null;

  // Public state
  public readonly activeDrillIndex = this._activeDrillIndex.asReadonly();
  public readonly startTime = this._startTime.asReadonly();
  public readonly accumulatedMs = this._accumulatedMs.asReadonly();
  public readonly isRunning = this._isRunning.asReadonly();
  
  public readonly remainingSeconds = computed(() => {
    const drill = this.currentDrill();
    if (!drill) return 0;
    const durationSeconds = (drill.durationMinutes || 5) * 60;
    const elapsedSeconds = Math.floor(this._elapsedMs() / 1000);
    return durationSeconds - elapsedSeconds;
  });
  
  public readonly currentDrill = computed(() => {
    const drills = this._drills();
    const index = this._activeDrillIndex();
    return drills[index] || null;
  });

  public readonly nextDrill = computed(() => {
    const drills = this._drills();
    const index = this._activeDrillIndex();
    return drills[index + 1] || null;
  });

  public readonly isFinished = computed(() => {
    return this._activeDrillIndex() >= this._drills().length && this._drills().length > 0;
  });

  constructor() {
    // Effect to persist state whenever it changes
    effect(() => {
      this.persistState();
    });
  }

  public initialize(
    practiceId: string,
    drills: PracticeDrill[],
    backendClockStartTime?: string | Date | null,
    backendClockAccumulatedMs?: number,
    backendCurrentPeriod?: number
  ): void {
    this._practiceId = practiceId;
    this._drills.set(drills);
    this.lastAlertedSecond = null;

    if (
      backendCurrentPeriod !== undefined ||
      backendClockStartTime !== undefined ||
      backendClockAccumulatedMs !== undefined
    ) {
      const targetIndex = backendCurrentPeriod ? Math.max(0, backendCurrentPeriod - 1) : 0;
      this._activeDrillIndex.set(targetIndex);
      this._accumulatedMs.set(backendClockAccumulatedMs || 0);

      if (backendClockStartTime) {
        const parsedStart = new Date(backendClockStartTime).getTime();
        this._startTime.set(parsedStart);
        this._isRunning.set(true);
        this.startTimer();
      } else {
        this._startTime.set(null);
        this._isRunning.set(false);
        this.stopTimer();
      }
      this.updateElapsed();
      return;
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(`apex_pacer_${practiceId}`);
    if (stored) {
      try {
        const state: PacerState = JSON.parse(stored);
        this._activeDrillIndex.set(state.activeDrillIndex);
        
        // Calculate accumulatedMs based on saved remainingSeconds
        const drill = drills[state.activeDrillIndex];
        const durationSeconds = drill ? (drill.durationMinutes || 5) * 60 : 0;
        const elapsedSeconds = Math.max(0, durationSeconds - state.remainingSeconds);
        this._accumulatedMs.set(elapsedSeconds * 1000);
        this._startTime.set(null);
        this._isRunning.set(false);
        this.updateElapsed();
      } catch {
        this.resetToStart();
      }
    } else {
      this.resetToStart();
    }
  }

  public syncFromRemote(
    remoteStartTime: string | Date | null,
    remoteAccumulatedMs: number,
    remoteCurrentPeriod?: number
  ): void {
    const parsedStart = remoteStartTime ? new Date(remoteStartTime).getTime() : null;
    const currentLocalStart = this._startTime();
    const currentLocalAccumulated = this._accumulatedMs();
    
    const startChanged = currentLocalStart !== parsedStart;
    const accumulatedChanged = Math.abs(currentLocalAccumulated - remoteAccumulatedMs) > 1000;
    
    if (remoteCurrentPeriod !== undefined) {
      const targetIndex = Math.max(0, remoteCurrentPeriod - 1);
      if (this._activeDrillIndex() !== targetIndex) {
        this._activeDrillIndex.set(targetIndex);
      }
    }

    if (startChanged || accumulatedChanged) {
      this._accumulatedMs.set(remoteAccumulatedMs);
      this._startTime.set(parsedStart);

      if (parsedStart !== null) {
        this._isRunning.set(true);
        this.startTimer();
      } else {
        this._isRunning.set(false);
        this.stopTimer();
      }
    }
    this.updateElapsed();
  }

  private resetToStart() {
    this._activeDrillIndex.set(0);
    this._startTime.set(null);
    this._accumulatedMs.set(0);
    this._elapsedMs.set(0);
    this._isRunning.set(false);
    this.updateElapsed();
  }

  public async start(): Promise<void> {
    if (this._isRunning() || this.isFinished()) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch { /* ignore */ }

    const now = Date.now();
    this._startTime.set(now);
    this._isRunning.set(true);

    this.startTimer();
    this.persistState();
  }

  public async pause(): Promise<void> {
    if (!this._isRunning()) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch { /* ignore */ }

    const now = Date.now();
    const startTime = this._startTime();
    const currentStint = startTime !== null ? now - startTime : 0;
    const newAccumulated = this._accumulatedMs() + currentStint;

    this._accumulatedMs.set(newAccumulated);
    this._startTime.set(null);
    this._isRunning.set(false);

    this.stopTimer();
    this.persistState();
  }

  public next(): void {
    const nextIndex = this._activeDrillIndex() + 1;
    this._activeDrillIndex.set(nextIndex);
    
    this._startTime.set(this._isRunning() ? Date.now() : null);
    this._accumulatedMs.set(0);
    this._elapsedMs.set(0);

    if (this.isFinished()) {
      void this.pause();
    }
    this.persistState();
  }

  public previous(): void {
    const prevIndex = Math.max(0, this._activeDrillIndex() - 1);
    this._activeDrillIndex.set(prevIndex);
    
    this._startTime.set(this._isRunning() ? Date.now() : null);
    this._accumulatedMs.set(0);
    this._elapsedMs.set(0);

    this.persistState();
  }

  public reset(): void {
    this.stopTimer();
    this._startTime.set(null);
    this._accumulatedMs.set(0);
    this._elapsedMs.set(0);
    this._activeDrillIndex.set(0);
    this._isRunning.set(false);
    this.persistState();
  }

  private startTimer() {
    if (this.intervalId) clearInterval(this.intervalId);
    
    this.updateElapsed();
    this.intervalId = setInterval(() => {
      this.updateElapsed();
    }, 100);
  }

  private stopTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateElapsed() {
    const startTime = this._startTime();
    if (this._isRunning() && startTime !== null) {
      const currentElapsed = Date.now() - startTime;
      this._elapsedMs.set(this._accumulatedMs() + currentElapsed);
    } else {
      this._elapsedMs.set(this._accumulatedMs());
    }

    const seconds = this.remainingSeconds();
    if (seconds === 0 && this.lastAlertedSecond !== 0) {
      this.lastAlertedSecond = 0;
      void this.triggerAlert();
    } else if (seconds < 0 && seconds % 30 === 0 && this.lastAlertedSecond !== seconds) {
      this.lastAlertedSecond = seconds;
      void this.triggerAlert();
    }
  }

  private async triggerAlert() {
    try {
      await Haptics.vibrate();
      const audio = new Audio('assets/whistle.mp3');
      await audio.play();
    } catch { /* ignore */ }
  }

  private persistState() {
    if (!this._practiceId) return;

    const state = {
      activeDrillIndex: this._activeDrillIndex(),
      remainingSeconds: this.remainingSeconds(),
      isRunning: this._isRunning(),
    };

    localStorage.setItem(`apex_pacer_${this._practiceId}`, JSON.stringify(state));
  }
}
