import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

export interface PlayerEntity {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  preferredPosition: string | null;
  parentEmail: string | null;
  teamId: string;
}

export interface CreatePlayerDto {
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  preferredPosition?: string;
  parentEmail?: string;
}

export interface UpdatePlayerDto {
  firstName?: string;
  lastName?: string;
  jerseyNumber?: number;
  preferredPosition?: string;
  parentEmail?: string;
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

  getPlayers(teamId: string): Observable<PlayerEntity[]> {
    return this.http.get<PlayerEntity[]>(`${this.apiUrl}/teams/${teamId}/players`);
  }

  addPlayer(teamId: string, data: CreatePlayerDto): Observable<PlayerEntity> {
    return this.http.post<PlayerEntity>(`${this.apiUrl}/teams/${teamId}/players`, data);
  }

  updatePlayer(teamId: string, playerId: string, data: UpdatePlayerDto): Observable<PlayerEntity> {
    return this.http.patch<PlayerEntity>(
      `${this.apiUrl}/teams/${teamId}/players/${playerId}`,
      data
    );
  }

  deletePlayer(teamId: string, playerId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teams/${teamId}/players/${playerId}`);
  }
}
