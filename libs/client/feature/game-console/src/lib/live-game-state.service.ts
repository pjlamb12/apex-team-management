import { Injectable, signal } from '@angular/core';

export interface GameEvent {
  type: string;
  playerId?: string;
  timestamp: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class LiveGameStateService {
  private _events = signal<GameEvent[]>([]);
  private _gameId: string | null = null;

  public readonly events = this._events.asReadonly();

  public initialize(gameId: string): void {
    this._gameId = gameId;
    const stored = localStorage.getItem(this.getStorageKey());
    if (stored) {
      try {
        const events = JSON.parse(stored);
        this._events.set(events);
      } catch (e) {
        console.error('Failed to parse stored events', e);
        this._events.set([]);
      }
    } else {
      this._events.set([]);
    }
  }

  public pushEvent(event: GameEvent): void {
    this._events.update((prev) => [...prev, event]);
    this.save();
  }

  public undo(): void {
    this._events.update((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
    this.save();
  }

  private save(): void {
    if (!this._gameId) return;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this._events()));
  }

  private getStorageKey(): string {
    return `game-events-${this._gameId}`;
  }
}
