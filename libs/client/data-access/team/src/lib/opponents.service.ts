import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import {
  Opponent,
  OpponentWithStats,
  OpponentScoutingNote,
} from '@apex-team/shared/util/models';

@Injectable({
  providedIn: 'root',
})
export class OpponentsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getOpponents(
    teamId: string,
    search?: string,
    threatLevel?: string,
  ): Observable<OpponentWithStats[]> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    if (threatLevel && threatLevel !== 'all') params['threatLevel'] = threatLevel;

    return this.http.get<OpponentWithStats[]>(
      `${this.apiUrl}/teams/${teamId}/opponents`,
      { params },
    );
  }

  getOpponent(teamId: string, opponentId: string): Observable<OpponentWithStats> {
    return this.http.get<OpponentWithStats>(
      `${this.apiUrl}/teams/${teamId}/opponents/${opponentId}`,
    );
  }

  createOpponent(teamId: string, data: Partial<Opponent>): Observable<Opponent> {
    return this.http.post<Opponent>(
      `${this.apiUrl}/teams/${teamId}/opponents`,
      data,
    );
  }

  updateOpponent(
    teamId: string,
    opponentId: string,
    data: Partial<Opponent>,
  ): Observable<Opponent> {
    return this.http.patch<Opponent>(
      `${this.apiUrl}/teams/${teamId}/opponents/${opponentId}`,
      data,
    );
  }

  deleteOpponent(teamId: string, opponentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/teams/${teamId}/opponents/${opponentId}`,
    );
  }

  addScoutingNote(
    teamId: string,
    opponentId: string,
    data: { content: string; tags?: string[] },
  ): Observable<OpponentScoutingNote> {
    return this.http.post<OpponentScoutingNote>(
      `${this.apiUrl}/teams/${teamId}/opponents/${opponentId}/scouting-notes`,
      data,
    );
  }

  deleteScoutingNote(
    teamId: string,
    opponentId: string,
    noteId: string,
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/teams/${teamId}/opponents/${opponentId}/scouting-notes/${noteId}`,
    );
  }
}
