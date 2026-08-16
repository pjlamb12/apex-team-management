import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import {
  TacticPlay,
  CreateTacticPlayDto,
  UpdateTacticPlayDto,
  TacticSport,
} from '@apex-team/shared/util/models';

@Injectable({
  providedIn: 'root',
})
export class TacticsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

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
    let params = new HttpParams();

    const targetSport = sport || this.selectedSport();
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
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      })
    );
  }

  getPlayById(id: string): Observable<TacticPlay> {
    return this.http.get<TacticPlay>(`${this.baseUrl}/${id}`);
  }

  createPlay(dto: CreateTacticPlayDto): Observable<TacticPlay> {
    return this.http.post<TacticPlay>(this.baseUrl, dto).pipe(
      tap((created) => {
        this.loadPlays().subscribe();
        this.activePlay.set(created);
      })
    );
  }

  updatePlay(id: string, dto: UpdateTacticPlayDto): Observable<TacticPlay> {
    return this.http.patch<TacticPlay>(`${this.baseUrl}/${id}`, dto).pipe(
      tap((updated) => {
        this.loadPlays().subscribe();
        if (this.activePlay()?.id === id) {
          this.activePlay.set(updated);
        }
      })
    );
  }

  deletePlay(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.loadPlays().subscribe();
        if (this.activePlay()?.id === id) {
          this.activePlay.set(null);
        }
      })
    );
  }

  seedPresets(sport?: string): Observable<TacticPlay[]> {
    const targetSport = sport || this.selectedSport();
    return this.http.post<TacticPlay[]>(`${this.baseUrl}/seed-presets`, { sport: targetSport }).pipe(
      tap(() => {
        this.loadPlays(targetSport).subscribe();
      })
    );
  }
}
