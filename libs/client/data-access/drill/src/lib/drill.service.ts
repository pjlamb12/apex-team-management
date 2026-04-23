import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { Drill, Tag, CreateDrillDto, UpdateDrillDto } from './drill.model';

@Injectable({
  providedIn: 'root',
})
export class DrillService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

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

  getDrills(tagNames?: string[]): Observable<Drill[]> {
    let params = new HttpParams();
    if (tagNames && tagNames.length > 0) {
      params = params.set('tags', tagNames.join(','));
    }
    return this.http.get<Drill[]>(this.baseUrl, { params }).pipe(
      tap((drills) => this._drills.set(drills))
    );
  }

  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.baseUrl}/tags`).pipe(
      tap((tags) => this._tags.set(tags))
    );
  }

  getDrillById(id: string): Observable<Drill> {
    return this.http.get<Drill>(`${this.baseUrl}/${id}`);
  }

  createDrill(dto: CreateDrillDto): Observable<Drill> {
    return this.http.post<Drill>(this.baseUrl, dto).pipe(
      tap(() => {
        this.getDrills().subscribe();
        this.getTags().subscribe();
      })
    );
  }

  updateDrill(id: string, dto: UpdateDrillDto): Observable<Drill> {
    return this.http.patch<Drill>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(() => {
        this.getDrills().subscribe();
        this.getTags().subscribe();
      })
    );
  }

  deleteDrill(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.getDrills().subscribe();
      })
    );
  }
}
