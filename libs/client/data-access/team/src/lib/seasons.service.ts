import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { Season, SeasonStats } from '@apex-team/shared/util/models';

@Injectable({
  providedIn: 'root',
})
export class SeasonsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  findAllForTeam(teamId: string): Observable<Season[]> {
    return this.http.get<Season[]>(`${this.apiUrl}/teams/${teamId}/seasons`);
  }

  findOne(id: string): Observable<Season> {
    return this.http.get<Season>(`${this.apiUrl}/seasons/${id}`);
  }

  create(teamId: string, data: Partial<Season>): Observable<Season> {
    return this.http.post<Season>(
      `${this.apiUrl}/teams/${teamId}/seasons`,
      data,
    );
  }

  update(id: string, data: Partial<Season>): Observable<Season> {
    return this.http.patch<Season>(`${this.apiUrl}/seasons/${id}`, data);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/seasons/${id}`);
  }

  getSeasonStats(teamId: string, seasonId: string): Observable<SeasonStats> {
    return this.http.get<SeasonStats>(
      `${this.apiUrl}/teams/${teamId}/seasons/${seasonId}/stats`,
    );
  }
}
