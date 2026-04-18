import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

export interface GameEntity {
  id: string;
  seasonId: string;
  opponent: string;
  scheduledAt: string;
  location: string | null;
  uniformColor: string | null;
  status: 'scheduled' | 'in_progress' | 'completed';
}

export interface CreateGameDto {
  opponent: string;
  scheduledAt: string;
  location?: string;
  uniformColor?: string;
}

export interface UpdateGameDto {
  opponent?: string;
  scheduledAt?: string;
  location?: string;
  uniformColor?: string;
}

export interface LineupEntry {
  id: string;
  gameId: string;
  playerId: string;
  positionName: string | null;
  status: 'starting' | 'bench';
}

export interface SaveLineupEntryDto {
  playerId: string;
  positionName?: string;
  status: 'starting' | 'bench';
}

export interface SaveLineupDto {
  entries: SaveLineupEntryDto[];
}

@Injectable({
  providedIn: 'root',
})
export class GamesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getGames(teamId: string): Observable<GameEntity[]> {
    return this.http.get<GameEntity[]>(`${this.apiUrl}/teams/${teamId}/games`);
  }

  createGame(teamId: string, data: CreateGameDto): Observable<GameEntity> {
    return this.http.post<GameEntity>(`${this.apiUrl}/teams/${teamId}/games`, data);
  }

  updateGame(gameId: string, data: UpdateGameDto): Observable<GameEntity> {
    return this.http.patch<GameEntity>(`${this.apiUrl}/games/${gameId}`, data);
  }

  deleteGame(gameId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/games/${gameId}`);
  }

  getLineup(gameId: string): Observable<LineupEntry[]> {
    return this.http.get<LineupEntry[]>(`${this.apiUrl}/games/${gameId}/lineup`);
  }

  saveLineup(gameId: string, data: SaveLineupDto): Observable<LineupEntry[]> {
    return this.http.post<LineupEntry[]>(`${this.apiUrl}/games/${gameId}/lineup`, data);
  }
}
