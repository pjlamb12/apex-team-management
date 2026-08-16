import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, catchError, map, tap } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { Drill, Tag, CreateDrillDto, UpdateDrillDto, ImportDrillDto } from './drill.model';
import { OfflineStorageService, NetworkStatusService } from '@apex-team/client/data-access/offline';

@Injectable({
  providedIn: 'root',
})
export class DrillService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly network = inject(NetworkStatusService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  private get baseUrl(): string {
    return `${this.apiUrl}/drills`;
  }

  // State
  private _drills = signal<Drill[]>([]);
  drills = this._drills.asReadonly();

  private _tags = signal<Tag[]>([]);
  tags = this._tags.asReadonly();

  constructor() {
    this.loadCachedDrills();
  }

  private async loadCachedDrills(): Promise<void> {
    const cached = await this.offlineStorage.getAll<Drill>(
      this.offlineStorage.STORES.DRILLS
    );
    if (cached && cached.length > 0 && this._drills().length === 0) {
      this._drills.set(cached);
    }
  }

  getDrills(tagNames?: string[], tagMode: 'and' | 'or' = 'or'): Observable<Drill[]> {
    if (!this.network.isOnline()) {
      return from(this.offlineStorage.getAll<Drill>(this.offlineStorage.STORES.DRILLS)).pipe(
        map((cached) => {
          this._drills.set(cached);
          return cached;
        })
      );
    }

    let params = new HttpParams();
    if (tagNames && tagNames.length > 0) {
      params = params.set('tags', tagNames.join(','));
      params = params.set('tagMode', tagMode);
    }
    return this.http.get<Drill[]>(this.baseUrl, { params }).pipe(
      tap((drills) => {
        this._drills.set(drills);
        this.offlineStorage.saveAll(this.offlineStorage.STORES.DRILLS, drills);
      }),
      catchError(() => {
        return from(this.offlineStorage.getAll<Drill>(this.offlineStorage.STORES.DRILLS)).pipe(
          map((cached) => {
            this._drills.set(cached);
            return cached;
          })
        );
      })
    );
  }

  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.baseUrl}/tags`).pipe(
      tap((tags) => this._tags.set(tags)),
      catchError(() => from(Promise.resolve(this._tags())))
    );
  }

  getDrillById(id: string): Observable<Drill> {
    if (!this.network.isOnline()) {
      return from(
        this.offlineStorage.getById<Drill>(this.offlineStorage.STORES.DRILLS, id)
      ).pipe(
        map((drill) => {
          if (!drill) throw new Error('Drill not found offline');
          return drill;
        })
      );
    }

    return this.http.get<Drill>(`${this.baseUrl}/${id}`).pipe(
      tap((drill) => {
        this.offlineStorage.save(this.offlineStorage.STORES.DRILLS, drill);
      }),
      catchError(() => {
        return from(
          this.offlineStorage.getById<Drill>(this.offlineStorage.STORES.DRILLS, id)
        ).pipe(
          map((drill) => {
            if (!drill) throw new Error('Drill not found offline');
            return drill;
          })
        );
      })
    );
  }

  createDrill(dto: CreateDrillDto): Observable<Drill> {
    return this.http.post<Drill>(this.baseUrl, dto).pipe(
      tap((created) => {
        this.offlineStorage.save(this.offlineStorage.STORES.DRILLS, created);
        this.getDrills().subscribe();
        this.getTags().subscribe();
      })
    );
  }

  importDrill(dto: ImportDrillDto): Observable<Drill> {
    return this.http.post<Drill>(`${this.baseUrl}/import`, dto).pipe(
      tap((imported) => {
        this.offlineStorage.save(this.offlineStorage.STORES.DRILLS, imported);
        this.getDrills().subscribe();
        this.getTags().subscribe();
      })
    );
  }

  updateDrill(id: string, dto: UpdateDrillDto): Observable<Drill> {
    return this.http.patch<Drill>(`${this.baseUrl}/${id}`, dto).pipe(
      tap((updated) => {
        this.offlineStorage.save(this.offlineStorage.STORES.DRILLS, updated);
        this.getDrills().subscribe();
        this.getTags().subscribe();
      })
    );
  }

  deleteDrill(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.offlineStorage.remove(this.offlineStorage.STORES.DRILLS, id);
        this.getDrills().subscribe();
      })
    );
  }
}
