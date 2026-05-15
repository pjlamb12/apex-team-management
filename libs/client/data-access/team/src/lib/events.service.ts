import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { Season } from '@apex-team/shared/util/models';

export interface LocationEntity {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  lat?: number;
  lon?: number;
}

export interface EventEntity {
  id: string;
  virtualId?: string;
  type: 'game' | 'practice';
  seasonId: string;
  opponent?: string;
  scheduledAt: string;
  location: string | null;
  locationId?: string | null;
  locationRef?: LocationEntity | null;
  uniformColor: string | null;
  isHomeGame: boolean;
  status: 'scheduled' | 'in_progress' | 'completed';
  durationMinutes?: number;
  notes?: string;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  goalEventCount?: number;
  periodCount?: number | null;
  periodLengthMinutes?: number | null;
  playersOnField?: number | null;
  currentPeriod?: number;
  recurrenceRule?: string | null;
  parentEventId?: string | null;
  weatherData?: {
    temp_f: number;
    condition: string;
    icon: string;
    chance_of_rain: number;
  } | null;
}

export interface CreateEventDto {
  type?: 'game' | 'practice';
  opponent?: string;
  scheduledAt?: string;
  location?: string;
  locationId?: string;
  uniformColor?: string;
  isHomeGame?: boolean;
  durationMinutes?: number;
  notes?: string;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  periodCount?: number;
  periodLengthMinutes?: number;
  playersOnField?: number;
  recurrenceRule?: string;
}

export interface UpdateEventDto {
  type?: 'game' | 'practice';
  opponent?: string;
  scheduledAt?: string;
  location?: string;
  locationId?: string;
  uniformColor?: string;
  isHomeGame?: boolean;
  durationMinutes?: number;
  notes?: string;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  periodCount?: number;
  periodLengthMinutes?: number;
  playersOnField?: number;
  currentPeriod?: number;
  status?: 'scheduled' | 'in_progress' | 'completed';
  recurrenceRule?: string;
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

  getGameEvents(teamId: string, eventId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/game-events`);
  }

  getLineup(teamId: string, eventId: string): Observable<LineupEntry[]> {
    return this.http.get<LineupEntry[]>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/lineup`);
  }

  saveLineup(teamId: string, eventId: string, data: SaveLineupDto): Observable<LineupEntry[]> {
    return this.http.post<LineupEntry[]>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/lineup`, data);
  }

  getPlayingTime(teamId: string, eventId: string): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/analytics/playing-time`);
  }

  refreshWeather(teamId: string, eventId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/weather/refresh`, {});
  }
}
