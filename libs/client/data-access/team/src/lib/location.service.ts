import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { LocationEntity } from './events.service';

export interface GeocodedLocation {
  name: string;
  lat: number;
  lon: number;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getLocations(teamId: string): Observable<LocationEntity[]> {
    return this.http.get<LocationEntity[]>(`${this.apiUrl}/teams/${teamId}/locations`);
  }

  search(teamId: string, query: string): Observable<GeocodedLocation[]> {
    return this.http.get<GeocodedLocation[]>(`${this.apiUrl}/teams/${teamId}/locations/search`, {
      params: { q: query }
    });
  }

  createLocation(teamId: string, data: GeocodedLocation & { address?: string }): Observable<LocationEntity> {
    return this.http.post<LocationEntity>(`${this.apiUrl}/teams/${teamId}/locations`, data);
  }

  createManual(teamId: string, data: Partial<LocationEntity>): Observable<LocationEntity> {
    return this.http.post<LocationEntity>(`${this.apiUrl}/teams/${teamId}/locations/manual`, data);
  }

  createCustomLocation(teamId: string, data: Partial<LocationEntity>): Observable<LocationEntity> {
    return this.http.post<LocationEntity>(`${this.apiUrl}/teams/${teamId}/locations`, data);
  }
}
