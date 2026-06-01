import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { League, LeagueStats } from '@apex-team/shared/util/models';

@Injectable({
  providedIn: 'root',
})
export class LeaguesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  findAllForSeason(seasonId: string): Observable<League[]> {
    return this.http.get<League[]>(`${this.apiUrl}/seasons/${seasonId}/leagues`);
  }

  findOne(id: string): Observable<League> {
    return this.http.get<League>(`${this.apiUrl}/leagues/${id}`);
  }

  create(seasonId: string, data: Partial<League>): Observable<League> {
    return this.http.post<League>(
      `${this.apiUrl}/seasons/${seasonId}/leagues`,
      data,
    );
  }

  update(id: string, data: Partial<League>): Observable<League> {
    return this.http.patch<League>(`${this.apiUrl}/leagues/${id}`, data);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/leagues/${id}`);
  }
}
