import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, of, catchError, map, tap } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import {
  TacticPlay,
  CreateTacticPlayDto,
  UpdateTacticPlayDto,
  TacticSport,
} from '@apex-team/shared/util/models';
import {
  OfflineStorageService,
  NetworkStatusService,
  OfflineSyncService,
} from '@apex-team/client/data-access/offline';

@Injectable({
  providedIn: 'root',
})
export class TacticsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly offlineStorage = inject(OfflineStorageService);
  readonly network = inject(NetworkStatusService);
  readonly syncService = inject(OfflineSyncService);

  private get apiUrl(): string {
    return (this.config.getConfigObjectKey('apiBaseUrl') as string) || '';
  }

  private get baseUrl(): string {
    return `${this.apiUrl}/tactics`;
  }

  // State Signals
  readonly selectedSport = signal<TacticSport>('soccer');
  readonly selectedCategory = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly activePlay = signal<TacticPlay | null>(null);
  readonly isLoading = signal<boolean>(false);

  private readonly _plays = signal<TacticPlay[]>([]);
  readonly plays = this._plays.asReadonly();

  readonly filteredPlays = computed(() => {
    const sport = this.selectedSport();
    const cat = this.selectedCategory().toLowerCase();
    const query = this.searchQuery().toLowerCase().trim();

    return this._plays().filter((play) => {
      if (play.sport.toLowerCase() !== sport.toLowerCase()) {
        return false;
      }
      if (cat !== 'all' && play.category.toLowerCase() !== cat) {
        return false;
      }
      if (query) {
        const matchesTitle = play.title.toLowerCase().includes(query);
        const matchesDesc = (play.description || '').toLowerCase().includes(query);
        const matchesTags = (play.tags || []).some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesDesc || matchesTags;
      }
      return true;
    });
  });

  constructor() {
    // Attempt instant warm cache load from IndexedDB on startup
    this.loadCachedPlays();
  }

  private async loadCachedPlays(): Promise<void> {
    const cached = await this.offlineStorage.getAll<TacticPlay>(
      this.offlineStorage.STORES.PLAYS
    );
    if (cached && cached.length > 0 && this._plays().length === 0) {
      this._plays.set(cached);
    }
  }

  setSport(sport: TacticSport): void {
    this.selectedSport.set(sport);
    this.loadPlays(sport).subscribe();
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setActivePlay(play: TacticPlay | null): void {
    this.activePlay.set(play);
  }

  loadPlays(sport?: string, category?: string, search?: string): Observable<TacticPlay[]> {
    this.isLoading.set(true);
    const targetSport = sport || this.selectedSport();

    if (!this.network.isOnline()) {
      return from(this.offlineStorage.getAll<TacticPlay>(this.offlineStorage.STORES.PLAYS)).pipe(
        map((cached) => {
          this._plays.set(cached);
          this.isLoading.set(false);
          return cached;
        })
      );
    }

    let params = new HttpParams();
    if (targetSport) {
      params = params.set('sport', targetSport);
    }
    if (category && category !== 'all') {
      params = params.set('category', category);
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<TacticPlay[]>(this.baseUrl, { params }).pipe(
      tap({
        next: (plays) => {
          this._plays.set(plays);
          this.offlineStorage.saveAll(this.offlineStorage.STORES.PLAYS, plays);
          this.isLoading.set(false);
        },
        error: () => {
          // Fallback to offline store on network/server error
          this.loadCachedPlays();
          this.isLoading.set(false);
        },
      }),
      catchError(() => {
        return from(this.offlineStorage.getAll<TacticPlay>(this.offlineStorage.STORES.PLAYS)).pipe(
          map((cached) => {
            this._plays.set(cached);
            return cached;
          })
        );
      })
    );
  }

  getPlayById(id: string): Observable<TacticPlay> {
    if (!this.network.isOnline()) {
      return from(
        this.offlineStorage.getById<TacticPlay>(this.offlineStorage.STORES.PLAYS, id)
      ).pipe(
        map((play) => {
          if (!play) throw new Error('Play not found offline');
          return play;
        })
      );
    }

    return this.http.get<TacticPlay>(`${this.baseUrl}/${id}`).pipe(
      tap((play) => {
        this.offlineStorage.save(this.offlineStorage.STORES.PLAYS, play);
      }),
      catchError(() => {
        return from(
          this.offlineStorage.getById<TacticPlay>(this.offlineStorage.STORES.PLAYS, id)
        ).pipe(
          map((play) => {
            if (!play) throw new Error('Play not found offline');
            return play;
          })
        );
      })
    );
  }

  createPlay(dto: CreateTacticPlayDto): Observable<TacticPlay> {
    if (!this.network.isOnline()) {
      return this.createPlayOffline(dto);
    }

    return this.http.post<TacticPlay>(this.baseUrl, dto).pipe(
      tap((created) => {
        this.offlineStorage.save(this.offlineStorage.STORES.PLAYS, created);
        this._plays.update((plays) => [created, ...plays.filter((p) => p.id !== created.id)]);
        this.activePlay.set(created);
      }),
      catchError(() => {
        return this.createPlayOffline(dto);
      })
    );
  }

  private createPlayOffline(dto: CreateTacticPlayDto): Observable<TacticPlay> {
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newPlay: TacticPlay = {
      id: tempId,
      coachId: 'offline_coach',
      title: dto.title,
      description: dto.description || undefined,
      sport: (dto.sport as TacticSport) || this.selectedSport(),
      category: dto.category || 'formation',
      pitchType: dto.pitchType || 'full_pitch',
      tags: dto.tags || [],
      canvasData: dto.canvasData || { pitchType: 'full_pitch', tokens: [], drawings: [] },
      notes: dto.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return from(
      (async () => {
        await this.offlineStorage.save(this.offlineStorage.STORES.PLAYS, newPlay);
        await this.offlineStorage.enqueueSync({
          action: 'CREATE',
          entity: 'play',
          tempId,
          payload: dto,
        });
        await this.syncService.refreshPendingCount();

        this._plays.update((plays) => [newPlay, ...plays]);
        this.activePlay.set(newPlay);
        return newPlay;
      })()
    );
  }

  updatePlay(id: string, dto: UpdateTacticPlayDto): Observable<TacticPlay> {
    if (!this.network.isOnline()) {
      return this.updatePlayOffline(id, dto);
    }

    return this.http.patch<TacticPlay>(`${this.baseUrl}/${id}`, dto).pipe(
      tap((updated) => {
        this.offlineStorage.save(this.offlineStorage.STORES.PLAYS, updated);
        this._plays.update((plays) =>
          plays.map((p) => (p.id === id ? updated : p))
        );
        if (this.activePlay()?.id === id) {
          this.activePlay.set(updated);
        }
      }),
      catchError(() => {
        return this.updatePlayOffline(id, dto);
      })
    );
  }

  private updatePlayOffline(id: string, dto: UpdateTacticPlayDto): Observable<TacticPlay> {
    return from(
      (async () => {
        const existing = await this.offlineStorage.getById<TacticPlay>(
          this.offlineStorage.STORES.PLAYS,
          id
        );

        const updated: TacticPlay = {
          ...(existing || ({} as TacticPlay)),
          id,
          coachId: existing?.coachId || 'offline_coach',
          title: dto.title !== undefined ? dto.title : existing?.title || '',
          description: dto.description !== undefined ? dto.description : existing?.description,
          sport: (dto.sport as TacticSport) || existing?.sport || this.selectedSport(),
          category: dto.category || existing?.category || 'formation',
          pitchType: dto.pitchType || existing?.pitchType || 'full_pitch',
          tags: dto.tags || existing?.tags || [],
          canvasData: dto.canvasData || existing?.canvasData || { pitchType: 'full_pitch', tokens: [], drawings: [] },
          notes: dto.notes !== undefined ? dto.notes : existing?.notes,
          createdAt: existing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await this.offlineStorage.save(this.offlineStorage.STORES.PLAYS, updated);

        // Only queue sync for server plays or update existing queue item
        if (!id.startsWith('offline_')) {
          await this.offlineStorage.enqueueSync({
            action: 'UPDATE',
            entity: 'play',
            entityId: id,
            payload: dto,
          });
        }
        await this.syncService.refreshPendingCount();

        this._plays.update((plays) =>
          plays.map((p) => (p.id === id ? updated : p))
        );
        if (this.activePlay()?.id === id) {
          this.activePlay.set(updated);
        }
        return updated;
      })()
    );
  }

  deletePlay(id: string): Observable<void> {
    if (!this.network.isOnline()) {
      return this.deletePlayOffline(id);
    }

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.offlineStorage.remove(this.offlineStorage.STORES.PLAYS, id);
        this._plays.update((plays) => plays.filter((p) => p.id !== id));
        if (this.activePlay()?.id === id) {
          this.activePlay.set(null);
        }
      }),
      catchError(() => {
        return this.deletePlayOffline(id);
      })
    );
  }

  private deletePlayOffline(id: string): Observable<void> {
    return from(
      (async () => {
        await this.offlineStorage.remove(this.offlineStorage.STORES.PLAYS, id);

        if (!id.startsWith('offline_')) {
          await this.offlineStorage.enqueueSync({
            action: 'DELETE',
            entity: 'play',
            entityId: id,
          });
        }
        await this.syncService.refreshPendingCount();

        this._plays.update((plays) => plays.filter((p) => p.id !== id));
        if (this.activePlay()?.id === id) {
          this.activePlay.set(null);
        }
      })()
    );
  }

  seedPresets(sport?: string): Observable<TacticPlay[]> {
    const targetSport = sport || this.selectedSport();
    return this.http.post<TacticPlay[]>(`${this.baseUrl}/seed-presets`, { sport: targetSport }).pipe(
      tap((seeded) => {
        this.offlineStorage.saveAll(this.offlineStorage.STORES.PLAYS, seeded);
        this.loadPlays(targetSport).subscribe();
      })
    );
  }
}
