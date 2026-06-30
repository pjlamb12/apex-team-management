import { Injectable, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LiveGameStateService, GameEvent } from './live-game-state.service';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { catchError, retry, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventSyncService {
  private http = inject(HttpClient);
  private stateService = inject(LiveGameStateService);
  private config = inject(RuntimeConfigLoaderService);

  private syncingIds = new Set<string>();
  private isSyncing = false;

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  constructor() {
    effect(() => {
      // Establish dependency on state service signals
      this.stateService.events();
      const eventId = this.stateService.eventId();
      const teamId = this.stateService.teamId();
      
      if (!eventId || !teamId) return;

      this.processNext();
    });
  }

  private getEventTempId(event: GameEvent, index: number): string {
    return `${event.timestamp}-${index}`;
  }

  private processNext(): void {
    if (this.isSyncing) {
      return;
    }

    const eventId = this.stateService.eventId();
    const teamId = this.stateService.teamId();
    if (!eventId || !teamId) return;

    const events = this.stateService.events();

    // Find the first unsynced event (in chronological order)
    const nextEventIndex = events.findIndex((event) => {
      // Unsynced active event
      const isUnsyncedAdd = event.status === 'active' && !event.synced && !event.syncFailed;
      // Unsynced delete event (needs backend ID)
      const isUnsyncedDelete = event.status === 'deleted' && event.id && !event.synced && !event.syncFailed;
      return isUnsyncedAdd || isUnsyncedDelete;
    });

    if (nextEventIndex === -1) {
      return;
    }

    const nextEvent = events[nextEventIndex];
    const tempId = this.getEventTempId(nextEvent, nextEventIndex);

    // If it's already in syncingIds, skip it to prevent double syncing (safety guard)
    if (this.syncingIds.has(tempId)) {
      return;
    }

    this.isSyncing = true;
    this.syncingIds.add(tempId);

    if (nextEvent.status === 'active') {
      this.syncAdd(teamId, eventId, nextEvent, nextEventIndex);
    } else {
      this.syncDelete(teamId, eventId, nextEvent, nextEventIndex);
    }
  }

  private syncAdd(teamId: string, eventId: string, event: GameEvent, index: number) {
    const tempId = this.getEventTempId(event, index);

    // If event has a nested payload object (like SHOOTOUT_KICK), flatten it into the parent payload first
    let payload: any = { ...event };
    if (event['payload']) {
      payload = { ...event['payload'], ...payload };
      delete payload.payload;
    }

    delete payload.type;
    delete payload.minuteOccurred;
    delete payload.synced;
    delete payload.status;
    delete payload.id;
    delete payload.syncFailed;

    if (event.type === 'SUB') {
      payload.inPlayerId = event.playerIdIn || event['inPlayerId'];
      payload.outPlayerId = event.playerIdOut || event['outPlayerId'];
      delete payload.playerIdIn;
      delete payload.playerIdOut;
    }

    // Clean up undefined properties
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const body = {
      eventType: event.type,
      minuteOccurred: event.minuteOccurred,
      payload
    };

    this.http.post<any>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/game-events`, body)
      .pipe(
        retry({ count: 3, delay: 1000 }),
        catchError(err => {
          console.error('Failed to sync event', err);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.stateService.markEventSynced(event.timestamp, response.id);
          }
          this.syncingIds.delete(tempId);
          this.isSyncing = false;
          this.processNext();
        },
        error: (err) => {
          this.syncingIds.delete(tempId);
          this.isSyncing = false;

          // If it's a persistent client-side error (like 400 Bad Request), mark it failed
          if (err && err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429) {
            this.stateService.markEventSyncFailed(event.timestamp);
          } else {
            // Otherwise, wait 3 seconds before retrying (connection error, rate limit, server error)
            setTimeout(() => this.processNext(), 3000);
          }
        }
      });
  }

  private syncDelete(teamId: string, eventId: string, event: GameEvent, index: number) {
    const tempId = this.getEventTempId(event, index);

    this.http.delete<any>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/game-events/${event.id}`)
      .pipe(
        retry({ count: 3, delay: 1000 }),
        catchError(err => {
          console.error('Failed to sync deletion', err);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.stateService.markDeletionSynced(event.timestamp);
          this.syncingIds.delete(tempId);
          this.isSyncing = false;
          this.processNext();
        },
        error: (err) => {
          this.syncingIds.delete(tempId);
          this.isSyncing = false;

          if (err && err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429) {
            this.stateService.markEventSyncFailed(event.timestamp);
          } else {
            setTimeout(() => this.processNext(), 3000);
          }
        }
      });
  }
}
