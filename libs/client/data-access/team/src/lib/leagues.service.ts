import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, tap, catchError, map } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { League } from '@apex-team/shared/util/models';
import { OfflineStorageService, NetworkStatusService } from '@apex-team/client/data-access/offline';

@Injectable({
  providedIn: 'root',
})
export class LeaguesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly network = inject(NetworkStatusService);

  private get apiUrl(): string {
    return (this.config.getConfigObjectKey('apiBaseUrl') as string) || 'http://localhost:3000/api';
  }

  findAllForSeason(seasonId: string): Observable<League[]> {
    if (!this.network.isOnline()) {
      return from(this.offlineStorage.getAll<League>(this.offlineStorage.STORES.LEAGUES)).pipe(
        map((leagues) => leagues.filter((l) => l.seasonId === seasonId))
      );
    }

    return this.http.get<League[]>(`${this.apiUrl}/seasons/${seasonId}/leagues`).pipe(
      tap((leagues) => {
        if (leagues && leagues.length > 0) {
          const leaguesWithSeason = leagues.map((l) => ({ ...l, seasonId: l.seasonId || seasonId }));
          this.offlineStorage.saveAll(this.offlineStorage.STORES.LEAGUES, leaguesWithSeason);
        }
      }),
      catchError(() => {
        return from(this.offlineStorage.getAll<League>(this.offlineStorage.STORES.LEAGUES)).pipe(
          map((leagues) => leagues.filter((l) => l.seasonId === seasonId))
        );
      })
    );
  }

  findOne(id: string): Observable<League> {
    if (!this.network.isOnline()) {
      return from(this.offlineStorage.getById<League>(this.offlineStorage.STORES.LEAGUES, id)).pipe(
        map((l) => {
          if (!l) throw new Error('League not found offline');
          return l;
        })
      );
    }

    return this.http.get<League>(`${this.apiUrl}/leagues/${id}`).pipe(
      tap((league) => {
        if (league) {
          this.offlineStorage.save(this.offlineStorage.STORES.LEAGUES, league);
        }
      }),
      catchError(() => {
        return from(this.offlineStorage.getById<League>(this.offlineStorage.STORES.LEAGUES, id)).pipe(
          map((l) => {
            if (!l) throw new Error('League not found offline');
            return l;
          })
        );
      })
    );
  }

  create(seasonId: string, data: Partial<League>): Observable<League> {
    return this.http.post<League>(
      `${this.apiUrl}/seasons/${seasonId}/leagues`,
      data
    ).pipe(
      tap((created) => {
        if (created) {
          this.offlineStorage.save(this.offlineStorage.STORES.LEAGUES, { ...created, seasonId });
        }
      })
    );
  }

  update(id: string, data: Partial<League>): Observable<League> {
    return this.http.patch<League>(`${this.apiUrl}/leagues/${id}`, data).pipe(
      tap((updated) => {
        if (updated) {
          this.offlineStorage.save(this.offlineStorage.STORES.LEAGUES, updated);
        }
      })
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/leagues/${id}`).pipe(
      tap(() => {
        this.offlineStorage.remove(this.offlineStorage.STORES.LEAGUES, id);
      })
    );
  }
}
