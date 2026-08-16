import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, from, tap, catchError, map } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { Season, SeasonStats } from '@apex-team/shared/util/models';
import { OfflineStorageService, NetworkStatusService } from '@apex-team/client/data-access/offline';

@Injectable({
  providedIn: 'root',
})
export class SeasonsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly network = inject(NetworkStatusService);

  public readonly selectedSeasonId = signal<string | null>(null);
  public readonly seasons = signal<Season[]>([]);

  private get apiUrl(): string {
    return (this.config.getConfigObjectKey('apiBaseUrl') as string) || 'http://localhost:3000/api';
  }

  async initialize(teamId: string): Promise<void> {
    try {
      const seasons = await firstValueFrom(this.findAllForTeam(teamId));
      this.seasons.set(seasons || []);

      if (seasons && seasons.length > 0) {
        const active = seasons.find((s) => s.isActive);
        this.selectedSeasonId.set(active?.id ?? seasons[0].id);
      } else {
        this.selectedSeasonId.set(null);
      }
    } catch {
      // Offline / error fallback
      const cached = await this.offlineStorage.getAll<Season>(this.offlineStorage.STORES.SEASONS);
      const teamSeasons = cached.filter((s) => s.teamId === teamId);
      this.seasons.set(teamSeasons);
      if (teamSeasons.length > 0) {
        const active = teamSeasons.find((s) => s.isActive);
        this.selectedSeasonId.set(active?.id ?? teamSeasons[0].id);
      } else {
        this.selectedSeasonId.set(null);
      }
    }
  }

  findAllForTeam(teamId: string): Observable<Season[]> {
    if (!this.network.isOnline()) {
      return from(this.offlineStorage.getAll<Season>(this.offlineStorage.STORES.SEASONS)).pipe(
        map((seasons) => seasons.filter((s) => s.teamId === teamId))
      );
    }

    return this.http.get<Season[]>(`${this.apiUrl}/teams/${teamId}/seasons`).pipe(
      tap((seasons) => {
        if (seasons && seasons.length > 0) {
          const seasonsWithTeam = seasons.map((s) => ({ ...s, teamId: s.teamId || teamId }));
          this.offlineStorage.saveAll(this.offlineStorage.STORES.SEASONS, seasonsWithTeam);
        }
      }),
      catchError(() => {
        return from(this.offlineStorage.getAll<Season>(this.offlineStorage.STORES.SEASONS)).pipe(
          map((seasons) => seasons.filter((s) => s.teamId === teamId))
        );
      })
    );
  }

  findOne(id: string): Observable<Season> {
    if (!this.network.isOnline()) {
      return from(this.offlineStorage.getById<Season>(this.offlineStorage.STORES.SEASONS, id)).pipe(
        map((s) => {
          if (!s) throw new Error('Season not found offline');
          return s;
        })
      );
    }

    return this.http.get<Season>(`${this.apiUrl}/seasons/${id}`).pipe(
      tap((season) => {
        if (season) {
          this.offlineStorage.save(this.offlineStorage.STORES.SEASONS, season);
        }
      }),
      catchError(() => {
        return from(this.offlineStorage.getById<Season>(this.offlineStorage.STORES.SEASONS, id)).pipe(
          map((s) => {
            if (!s) throw new Error('Season not found offline');
            return s;
          })
        );
      })
    );
  }

  create(teamId: string, data: Partial<Season>): Observable<Season> {
    return this.http
      .post<Season>(`${this.apiUrl}/teams/${teamId}/seasons`, { ...data, teamId })
      .pipe(
        tap((created) => {
          if (created) {
            this.offlineStorage.save(this.offlineStorage.STORES.SEASONS, { ...created, teamId });
          }
        })
      );
  }

  update(id: string, data: Partial<Season>): Observable<Season> {
    return this.http.patch<Season>(`${this.apiUrl}/seasons/${id}`, data).pipe(
      tap((updated) => {
        if (updated) {
          this.offlineStorage.save(this.offlineStorage.STORES.SEASONS, updated);
        }
      })
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/seasons/${id}`).pipe(
      tap(() => {
        this.offlineStorage.remove(this.offlineStorage.STORES.SEASONS, id);
      })
    );
  }

  getSeasonStats(teamId: string, seasonId: string, leagueId?: string): Observable<SeasonStats> {
    const params: any = {};
    if (leagueId) {
      params.leagueId = leagueId;
    }
    return this.http.get<SeasonStats>(
      `${this.apiUrl}/teams/${teamId}/seasons/${seasonId}/stats`,
      { params }
    );
  }
}
