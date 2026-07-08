import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { SeasonChecklistItem, SeasonChecklistValue } from '@apex-team/shared/util/models';

@Injectable({
  providedIn: 'root',
})
export class SeasonChecklistService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  findItems(seasonId: string): Observable<SeasonChecklistItem[]> {
    return this.http.get<SeasonChecklistItem[]>(`${this.apiUrl}/seasons/${seasonId}/checklist/items`);
  }

  createItem(seasonId: string, name: string): Observable<SeasonChecklistItem> {
    return this.http.post<SeasonChecklistItem>(
      `${this.apiUrl}/seasons/${seasonId}/checklist/items`,
      { name }
    );
  }

  removeItem(seasonId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/seasons/${seasonId}/checklist/items/${itemId}`);
  }

  findValues(seasonId: string): Observable<SeasonChecklistValue[]> {
    return this.http.get<SeasonChecklistValue[]>(`${this.apiUrl}/seasons/${seasonId}/checklist/values`);
  }

  upsertValue(
    seasonId: string,
    playerId: string,
    itemId: string,
    value: string | null,
  ): Observable<SeasonChecklistValue> {
    return this.http.post<SeasonChecklistValue>(
      `${this.apiUrl}/seasons/${seasonId}/checklist/values`,
      { playerId, itemId, value }
    );
  }
}
