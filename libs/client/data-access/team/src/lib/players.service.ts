import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, catchError, map, tap } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { OfflineStorageService, NetworkStatusService } from '@apex-team/client/data-access/offline';

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
  seasonId?: string;
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
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly network = inject(NetworkStatusService);

  private get apiUrl(): string {
    return (this.config.getConfigObjectKey('apiBaseUrl') as string) || 'http://localhost:3000/api';
  }

  getPlayers(teamId: string, includeInactive = false): Observable<PlayerEntity[]> {
    if (!this.network.isOnline()) {
      return from(this.offlineStorage.getAll<PlayerEntity>(this.offlineStorage.STORES.PLAYERS)).pipe(
        map((players) =>
          players.filter((p) => p.teamId === teamId && (includeInactive || p.isActive !== false))
        )
      );
    }

    const params = includeInactive ? '?includeInactive=true' : '';
    return this.http.get<PlayerEntity[]>(`${this.apiUrl}/teams/${teamId}/players${params}`).pipe(
      tap((players) => {
        if (players && players.length > 0) {
          const playersWithTeam = players.map((p) => ({ ...p, teamId: p.teamId || teamId }));
          this.offlineStorage.saveAll(this.offlineStorage.STORES.PLAYERS, playersWithTeam);
        }
      }),
      catchError(() => {
        return from(this.offlineStorage.getAll<PlayerEntity>(this.offlineStorage.STORES.PLAYERS)).pipe(
          map((players) =>
            players.filter((p) => p.teamId === teamId && (includeInactive || p.isActive !== false))
          )
        );
      })
    );
  }

  getPlayersForSeason(teamId: string, seasonId: string, includeInactive = false): Observable<PlayerEntity[]> {
    if (!this.network.isOnline()) {
      return from(this.offlineStorage.getAll<PlayerEntity>(this.offlineStorage.STORES.PLAYERS)).pipe(
        map((players) =>
          players.filter((p) => p.teamId === teamId && (includeInactive || p.isActive !== false))
        )
      );
    }

    const params = includeInactive ? '?includeInactive=true' : '';
    return this.http.get<PlayerEntity[]>(`${this.apiUrl}/teams/${teamId}/players/seasons/${seasonId}${params}`).pipe(
      tap((players) => {
        if (players && players.length > 0) {
          const playersWithTeam = players.map((p) => ({ ...p, teamId: p.teamId || teamId }));
          this.offlineStorage.saveAll(this.offlineStorage.STORES.PLAYERS, playersWithTeam);
        }
      }),
      catchError(() => {
        return from(this.offlineStorage.getAll<PlayerEntity>(this.offlineStorage.STORES.PLAYERS)).pipe(
          map((players) =>
            players.filter((p) => p.teamId === teamId && (includeInactive || p.isActive !== false))
          )
        );
      })
    );
  }

  getGuestPlayersForLeague(teamId: string, leagueId: string): Observable<PlayerEntity[]> {
    return this.http.get<PlayerEntity[]>(`${this.apiUrl}/teams/${teamId}/players/leagues/${leagueId}`);
  }

  addPlayer(teamId: string, data: CreatePlayerDto): Observable<PlayerEntity> {
    return this.http.post<PlayerEntity>(`${this.apiUrl}/teams/${teamId}/players`, data).pipe(
      tap((created) => {
        this.offlineStorage.save(this.offlineStorage.STORES.PLAYERS, created);
      })
    );
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
    ).pipe(
      tap((updated) => {
        this.offlineStorage.save(this.offlineStorage.STORES.PLAYERS, updated);
      })
    );
  }

  deactivatePlayer(teamId: string, playerId: string): Observable<PlayerEntity> {
    return this.updatePlayer(teamId, playerId, { isActive: false });
  }

  reactivatePlayer(teamId: string, playerId: string): Observable<PlayerEntity> {
    return this.updatePlayer(teamId, playerId, { isActive: true });
  }

  deletePlayer(teamId: string, playerId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teams/${teamId}/players/${playerId}`).pipe(
      tap(() => {
        this.offlineStorage.remove(this.offlineStorage.STORES.PLAYERS, playerId);
      })
    );
  }
}
