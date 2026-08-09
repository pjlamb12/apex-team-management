import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

export interface PlayerEntity {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  preferredPosition?: string;
  parentEmail?: string;
  teamId: string;
  isGuest?: boolean;
  isActive?: boolean;
  leagueId?: string | null;
}

export interface CreatePlayerDto {
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  parentEmail?: string;
  seasonId?: string; // Optional: add to season roster immediately
  isGuest?: boolean;
  isActive?: boolean;
  leagueId?: string;
}

export interface UpdatePlayerDto {
  firstName?: string;
  lastName?: string;
  jerseyNumber?: number;
  preferredPosition?: string;
  parentEmail?: string;
  isGuest?: boolean;
  isActive?: boolean;
  leagueId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PlayersService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getPlayers(teamId: string, includeInactive = false): Observable<PlayerEntity[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.http.get<PlayerEntity[]>(`${this.apiUrl}/teams/${teamId}/players${params}`);
  }

  getPlayersForSeason(teamId: string, seasonId: string, includeInactive = false): Observable<PlayerEntity[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.http.get<PlayerEntity[]>(`${this.apiUrl}/teams/${teamId}/players/seasons/${seasonId}${params}`);
  }

  getGuestPlayersForLeague(teamId: string, leagueId: string): Observable<PlayerEntity[]> {
    return this.http.get<PlayerEntity[]>(`${this.apiUrl}/teams/${teamId}/players/leagues/${leagueId}`);
  }

  addPlayer(teamId: string, data: CreatePlayerDto): Observable<PlayerEntity> {
    return this.http.post<PlayerEntity>(`${this.apiUrl}/teams/${teamId}/players`, data);
  }

  addGuestPlayerToLeague(teamId: string, leagueId: string, data: CreatePlayerDto): Observable<PlayerEntity> {
    return this.http.post<PlayerEntity>(`${this.apiUrl}/teams/${teamId}/players/leagues/${leagueId}`, data);
  }

  addPlayerToSeason(teamId: string, seasonId: string, playerId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/teams/${teamId}/players/seasons/${seasonId}/${playerId}`, {});
  }

  removePlayerFromSeason(teamId: string, seasonId: string, playerId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teams/${teamId}/players/seasons/${seasonId}/${playerId}`);
  }

  updatePlayer(
    teamId: string,
    playerId: string,
    data: UpdatePlayerDto
  ): Observable<PlayerEntity> {
    return this.http.patch<PlayerEntity>(
      `${this.apiUrl}/teams/${teamId}/players/${playerId}`,
      data
    );
  }

  deactivatePlayer(teamId: string, playerId: string): Observable<PlayerEntity> {
    return this.updatePlayer(teamId, playerId, { isActive: false });
  }

  reactivatePlayer(teamId: string, playerId: string): Observable<PlayerEntity> {
    return this.updatePlayer(teamId, playerId, { isActive: true });
  }

  deletePlayer(teamId: string, playerId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teams/${teamId}/players/${playerId}`);
  }
}
