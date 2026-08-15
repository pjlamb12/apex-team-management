import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import {
  PlayerAward,
  CreatePlayerAwardDto,
  TeamAwardsSummary,
} from '@apex-team/shared/util/models';

@Injectable({
  providedIn: 'root',
})
export class AwardsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getAwards(
    teamId: string,
    filters?: {
      seasonId?: string;
      playerId?: string;
      eventId?: string;
      category?: string;
    },
  ): Observable<PlayerAward[]> {
    const params: Record<string, string> = {};
    if (filters?.seasonId) params['seasonId'] = filters.seasonId;
    if (filters?.playerId) params['playerId'] = filters.playerId;
    if (filters?.eventId) params['eventId'] = filters.eventId;
    if (filters?.category) params['category'] = filters.category;

    return this.http.get<PlayerAward[]>(`${this.apiUrl}/teams/${teamId}/awards`, {
      params,
    });
  }

  getSummary(teamId: string, seasonId?: string): Observable<TeamAwardsSummary> {
    const params: Record<string, string> = {};
    if (seasonId) params['seasonId'] = seasonId;

    return this.http.get<TeamAwardsSummary>(
      `${this.apiUrl}/teams/${teamId}/awards/summary`,
      { params },
    );
  }

  getPlayerAwards(teamId: string, playerId: string): Observable<PlayerAward[]> {
    return this.http.get<PlayerAward[]>(
      `${this.apiUrl}/teams/${teamId}/players/${playerId}/awards`,
    );
  }

  getEventAwards(teamId: string, eventId: string): Observable<PlayerAward[]> {
    return this.http.get<PlayerAward[]>(
      `${this.apiUrl}/teams/${teamId}/events/${eventId}/awards`,
    );
  }

  createAward(teamId: string, data: CreatePlayerAwardDto): Observable<PlayerAward> {
    return this.http.post<PlayerAward>(
      `${this.apiUrl}/teams/${teamId}/awards`,
      data,
    );
  }

  createBatch(teamId: string, awards: CreatePlayerAwardDto[]): Observable<PlayerAward[]> {
    return this.http.post<PlayerAward[]>(
      `${this.apiUrl}/teams/${teamId}/awards/batch`,
      { awards },
    );
  }

  deleteAward(teamId: string, awardId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/teams/${teamId}/awards/${awardId}`,
    );
  }
}
