import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import {
  PlayerGoal,
  PlayerGoalNote,
  CreatePlayerGoalDto,
  UpdatePlayerGoalDto,
  CreateGoalNoteDto,
  TeamGoalsSummary,
} from '@apex-team/shared/util/models';

@Injectable({
  providedIn: 'root',
})
export class GoalsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getGoals(
    teamId: string,
    filters?: {
      seasonId?: string;
      playerId?: string;
      category?: string;
      status?: string;
    },
  ): Observable<PlayerGoal[]> {
    const params: Record<string, string> = {};
    if (filters?.seasonId) params['seasonId'] = filters.seasonId;
    if (filters?.playerId) params['playerId'] = filters.playerId;
    if (filters?.category) params['category'] = filters.category;
    if (filters?.status) params['status'] = filters.status;

    return this.http.get<PlayerGoal[]>(`${this.apiUrl}/teams/${teamId}/goals`, {
      params,
    });
  }

  getPlayerGoals(
    teamId: string,
    playerId: string,
    seasonId?: string,
  ): Observable<PlayerGoal[]> {
    const params: Record<string, string> = {};
    if (seasonId) params['seasonId'] = seasonId;

    return this.http.get<PlayerGoal[]>(
      `${this.apiUrl}/teams/${teamId}/players/${playerId}/goals`,
      { params },
    );
  }

  getGoal(teamId: string, goalId: string): Observable<PlayerGoal> {
    return this.http.get<PlayerGoal>(
      `${this.apiUrl}/teams/${teamId}/goals/${goalId}`,
    );
  }

  getSummary(teamId: string, seasonId?: string): Observable<TeamGoalsSummary> {
    const params: Record<string, string> = {};
    if (seasonId) params['seasonId'] = seasonId;

    return this.http.get<TeamGoalsSummary>(
      `${this.apiUrl}/teams/${teamId}/goals/summary`,
      { params },
    );
  }

  createGoal(
    teamId: string,
    playerId: string,
    data: CreatePlayerGoalDto,
  ): Observable<PlayerGoal> {
    return this.http.post<PlayerGoal>(
      `${this.apiUrl}/teams/${teamId}/players/${playerId}/goals`,
      data,
    );
  }

  updateGoal(
    teamId: string,
    goalId: string,
    data: UpdatePlayerGoalDto,
  ): Observable<PlayerGoal> {
    return this.http.patch<PlayerGoal>(
      `${this.apiUrl}/teams/${teamId}/goals/${goalId}`,
      data,
    );
  }

  deleteGoal(teamId: string, goalId: string): Observable<{ success: boolean; id: string }> {
    return this.http.delete<{ success: boolean; id: string }>(
      `${this.apiUrl}/teams/${teamId}/goals/${goalId}`,
    );
  }

  addGoalNote(
    teamId: string,
    goalId: string,
    data: CreateGoalNoteDto,
  ): Observable<PlayerGoalNote> {
    return this.http.post<PlayerGoalNote>(
      `${this.apiUrl}/teams/${teamId}/goals/${goalId}/notes`,
      data,
    );
  }

  deleteGoalNote(
    teamId: string,
    goalId: string,
    noteId: string,
  ): Observable<{ success: boolean; id: string }> {
    return this.http.delete<{ success: boolean; id: string }>(
      `${this.apiUrl}/teams/${teamId}/goals/${goalId}/notes/${noteId}`,
    );
  }
}
