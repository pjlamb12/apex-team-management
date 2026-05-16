import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

export interface PlayerPerformanceMetrics {
  playerId: string;
  firstName: string;
  lastName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  gamesPlayed: number;
}

export interface PlayerPlaytime {
  playerId: string;
  totalSeconds: number;
  positionSeconds: Record<string, number>;
}

export interface ParticipationStats {
  playerId: string;
  firstName: string;
  lastName: string;
  totalEvents: number;
  present: number;
  percentage: number;
}

export interface PlayerHistoryEntry {
  eventId: string;
  eventName: string;
  eventType: 'game' | 'practice' | 'tryout';
  scheduledAt: Date;
  status: 'present' | 'absent' | 'tardy' | 'injured' | 'unknown';
  goals: number;
  assists: number;
  playingTimeSeconds: number;
}

export interface PlayerProfileAnalytics {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number | null;
    preferredPosition: string | null;
  };
  totalGamesPlayed: number;
  totalGoals: number;
  totalAssists: number;
  totalMinutes: number;
  positionDistribution: Record<string, number>;
  history: PlayerHistoryEntry[];
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getPerformanceMetrics(teamId: string, seasonId?: string): Observable<PlayerPerformanceMetrics[]> {
    const params: any = {};
    if (seasonId) params.seasonId = seasonId;
    return this.http.get<PlayerPerformanceMetrics[]>(`${this.apiUrl}/teams/${teamId}/analytics/performance`, { params });
  }

  getTeamPlayingTime(teamId: string, seasonId?: string): Observable<Record<string, PlayerPlaytime>> {
    const params: any = {};
    if (seasonId) params.seasonId = seasonId;
    return this.http.get<Record<string, PlayerPlaytime>>(`${this.apiUrl}/teams/${teamId}/analytics/playing-time`, { params });
  }

  getParticipationStats(teamId: string, seasonId?: string): Observable<ParticipationStats[]> {
    const params: any = {};
    if (seasonId) params.seasonId = seasonId;
    return this.http.get<ParticipationStats[]>(`${this.apiUrl}/teams/${teamId}/participation`, { params });
  }

  getPlayerProfile(teamId: string, playerId: string, seasonId?: string): Observable<PlayerProfileAnalytics> {
    const params: any = {};
    if (seasonId) params.seasonId = seasonId;
    return this.http.get<PlayerProfileAnalytics>(`${this.apiUrl}/teams/${teamId}/players/${playerId}/analytics`, { params });
  }

  exportData(teamId: string, options: any): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/teams/${teamId}/analytics/export/${options.format}`, {
      params: options,
      responseType: 'blob'
    });
  }
}
