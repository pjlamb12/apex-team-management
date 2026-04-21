import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { Season } from '@apex-team/shared/util/models';

export interface EventEntity {
  id: string;
  type: 'game' | 'practice';
  seasonId: string;
  opponent?: string;
  scheduledAt: string;
  location: string | null;
  uniformColor: string | null;
  isHomeGame: boolean;
  status: 'scheduled' | 'in_progress' | 'completed';
  durationMinutes?: number;
  notes?: string;
}

export interface CreateEventDto {
  type?: 'game' | 'practice';
  opponent?: string;
  scheduledAt?: string;
  location?: string;
  uniformColor?: string;
  isHomeGame?: boolean;
  durationMinutes?: number;
  notes?: string;
}

export interface UpdateEventDto {
  type?: 'game' | 'practice';
  opponent?: string;
  scheduledAt?: string;
  location?: string;
  uniformColor?: string;
  isHomeGame?: boolean;
  durationMinutes?: number;
  notes?: string;
}

export interface LineupEntry {
  id: string;
  eventId: string;
  playerId: string;
  player: { id: string; firstName: string; lastName: string; jerseyNumber: number | null };
  positionName: string | null;
  slotIndex: number | null;
  status: 'starting' | 'bench';
}

export interface SaveLineupEntryDto {
  playerId: string;
  positionName?: string;
  slotIndex?: number;
  status: 'starting' | 'bench';
}

export interface SaveLineupDto {
  entries: SaveLineupEntryDto[];
}

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getEvents(teamId: string, scope: 'upcoming' | 'past' = 'upcoming', seasonId?: string): Observable<EventEntity[]> {
    const params: any = { scope };
    if (seasonId) {
      params.seasonId = seasonId;
    }
    return this.http.get<EventEntity[]>(`${this.apiUrl}/teams/${teamId}/events`, {
      params
    });
  }

  getActiveSeason(teamId: string): Observable<Season> {
    return this.http.get<Season>(`${this.apiUrl}/teams/${teamId}/seasons/active`);
  }

  createEvent(teamId: string, data: CreateEventDto): Observable<EventEntity> {
    return this.http.post<EventEntity>(`${this.apiUrl}/teams/${teamId}/events`, data);
  }

  getEvent(teamId: string, eventId: string): Observable<EventEntity> {
    return this.http.get<EventEntity>(`${this.apiUrl}/teams/${teamId}/events/${eventId}`);
  }

  updateEvent(teamId: string, eventId: string, data: UpdateEventDto): Observable<EventEntity> {
    return this.http.patch<EventEntity>(`${this.apiUrl}/teams/${teamId}/events/${eventId}`, data);
  }

  deleteEvent(teamId: string, eventId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teams/${teamId}/events/${eventId}`);
  }

  getLineup(teamId: string, eventId: string): Observable<LineupEntry[]> {
    return this.http.get<LineupEntry[]>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/lineup`);
  }

  saveLineup(teamId: string, eventId: string, data: SaveLineupDto): Observable<LineupEntry[]> {
    return this.http.post<LineupEntry[]>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/lineup`, data);
  }
}
