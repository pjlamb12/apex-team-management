import { Injectable, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LiveGameStateService, GameEvent } from './live-game-state.service';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { catchError, of, retry } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventSyncService {
  private http = inject(HttpClient);
  private stateService = inject(LiveGameStateService);
  private config = inject(RuntimeConfigLoaderService);

  private syncingIds = new Set<string>();

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  constructor() {
    effect(() => {
      const events = this.stateService.events();
      const gameId = this.stateService.gameId();
      
      if (!gameId) return;

      events.forEach((event, index) => {
        const tempId = this.getEventTempId(event, index);
        
        // If it's active and not synced, sync it
        if (event.status === 'active' && !event.synced && !this.syncingIds.has(tempId)) {
          this.syncAdd(gameId, event, index);
        }
        // If it's deleted, has a backend ID, and is not synced (meaning deletion not synced), delete it
        else if (event.status === 'deleted' && event.id && !event.synced && !this.syncingIds.has(tempId)) {
          this.syncDelete(gameId, event, index);
        }
      });
    });
  }

  private getEventTempId(event: GameEvent, index: number): string {
    return `${event.timestamp}-${index}`;
  }

  private syncAdd(gameId: string, event: GameEvent, index: number) {
    const tempId = this.getEventTempId(event, index);
    this.syncingIds.add(tempId);

    const payload: any = { ...event };
    delete payload.type;
    delete payload.timestamp;
    delete payload.minuteOccurred;
    delete payload.synced;
    delete payload.status;
    delete payload.id;

    const body = {
      eventType: event.type,
      minuteOccurred: event.minuteOccurred,
      payload
    };

    this.http.post<any>(`${this.apiUrl}/games/${gameId}/events`, body)
      .pipe(
        retry({ count: 3, delay: 1000 }),
        catchError(err => {
          console.error('Failed to sync event', err);
          this.syncingIds.delete(tempId);
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          event.id = response.id;
          event.synced = true;
          this.syncingIds.delete(tempId);
          this.stateService.save();
        }
      });
  }

  private syncDelete(gameId: string, event: GameEvent, index: number) {
    const tempId = this.getEventTempId(event, index);
    this.syncingIds.add(tempId);

    this.http.delete<any>(`${this.apiUrl}/games/${gameId}/events/${event.id}`)
      .pipe(
        retry({ count: 3, delay: 1000 }),
        catchError(err => {
          console.error('Failed to sync deletion', err);
          this.syncingIds.delete(tempId);
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          event.synced = true; // Mark deletion as synced
          this.syncingIds.delete(tempId);
          this.stateService.save();
        },
        error: () => {
          this.syncingIds.delete(tempId);
        }
      });
  }
}
