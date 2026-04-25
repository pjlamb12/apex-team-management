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
  private _remainingSeconds = signal<number>(0);
  private _isRunning = signal<boolean>(false);
  private _practiceId: string | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Public state
  public readonly activeDrillIndex = this._activeDrillIndex.asReadonly();
  public readonly remainingSeconds = this._remainingSeconds.asReadonly();
  public readonly isRunning = this._isRunning.asReadonly();
  
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

  public initialize(practiceId: string, drills: PracticeDrill[]): void {
    this._practiceId = practiceId;
    this._drills.set(drills);

    const stored = localStorage.getItem(`apex_pacer_${practiceId}`);
    if (stored) {
      try {
        const state: PacerState = JSON.parse(stored);
        this._activeDrillIndex.set(state.activeDrillIndex);
        this._remainingSeconds.set(state.remainingSeconds);
        // We don't auto-start from storage
        this._isRunning.set(false);
      } catch {
        this.resetToStart();
      }
    } else {
      this.resetToStart();
    }
  }

  private resetToStart() {
    this._activeDrillIndex.set(0);
    this.updateRemainingSecondsFromCurrent();
    this._isRunning.set(false);
  }

  private updateRemainingSecondsFromCurrent() {
    const drill = this.currentDrill();
    if (drill) {
      this._remainingSeconds.set((drill.durationMinutes || 5) * 60);
    } else {
      this._remainingSeconds.set(0);
    }
  }

  public async start(): Promise<void> {
    if (this._isRunning() || this.isFinished()) return;

    this._isRunning.set(true);
    this.startTimer();
    
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch { /* ignore */ }
  }

  public async pause(): Promise<void> {
    this._isRunning.set(false);
    this.stopTimer();
    
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch { /* ignore */ }
  }

  public next(): void {
    const nextIndex = this._activeDrillIndex() + 1;
    this._activeDrillIndex.set(nextIndex);
    this.updateRemainingSecondsFromCurrent();
    
    if (this.isFinished()) {
      void this.pause();
    }
    this.persistState();
  }

  public previous(): void {
    const prevIndex = Math.max(0, this._activeDrillIndex() - 1);
    this._activeDrillIndex.set(prevIndex);
    this.updateRemainingSecondsFromCurrent();
    this.persistState();
  }

  public reset(): void {
    void this.pause();
    this.resetToStart();
    this.persistState();
  }

  private startTimer() {
    if (this.intervalId) clearInterval(this.intervalId);
    
    this.intervalId = setInterval(() => {
      this._remainingSeconds.update(s => s - 1);
      
      const seconds = this._remainingSeconds();
      if (seconds === 0) {
        void this.triggerAlert();
      } else if (seconds < 0 && seconds % 30 === 0) {
        // Periodic alert for overtime
        void this.triggerAlert();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async triggerAlert() {
    try {
      await Haptics.vibrate();
      // Browser audio could be added here
      const audio = new Audio('assets/whistle.mp3'); // Assuming we add this asset
      await audio.play();
    } catch { /* ignore */ }
  }

  private persistState() {
    if (!this._practiceId) return;

    const state: PacerState = {
      activeDrillIndex: this._activeDrillIndex(),
      remainingSeconds: this._remainingSeconds(),
      isRunning: this._isRunning(),
    };

    localStorage.setItem(`apex_pacer_${this._practiceId}`, JSON.stringify(state));
  }
}
