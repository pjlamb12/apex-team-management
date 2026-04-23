import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import {
  PracticeDrill,
  AddDrillToPlanDto,
  UpdatePracticeDrillDto,
  ReorderPracticeDrillsDto,
} from './drill.model';

@Injectable({
  providedIn: 'root',
})
export class PracticeDrillsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  private getBaseUrl(teamId: string, eventId: string): string {
    return `${this.apiUrl}/teams/${teamId}/events/${eventId}/drills`;
  }

  getPlan(teamId: string, eventId: string): Observable<PracticeDrill[]> {
    return this.http.get<PracticeDrill[]>(this.getBaseUrl(teamId, eventId));
  }

  addDrill(
    teamId: string,
    eventId: string,
    dto: AddDrillToPlanDto,
  ): Observable<PracticeDrill> {
    return this.http.post<PracticeDrill>(this.getBaseUrl(teamId, eventId), dto);
  }

  updateDrill(
    teamId: string,
    eventId: string,
    practiceDrillId: string,
    dto: UpdatePracticeDrillDto,
  ): Observable<PracticeDrill> {
    return this.http.patch<PracticeDrill>(
      `${this.getBaseUrl(teamId, eventId)}/${practiceDrillId}`,
      dto,
    );
  }

  removeDrill(
    teamId: string,
    eventId: string,
    practiceDrillId: string,
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.getBaseUrl(teamId, eventId)}/${practiceDrillId}`,
    );
  }

  reorderDrills(
    teamId: string,
    eventId: string,
    ids: string[],
  ): Observable<void> {
    const dto: ReorderPracticeDrillsDto = { ids };
    return this.http.put<void>(
      `${this.getBaseUrl(teamId, eventId)}/reorder`,
      dto,
    );
  }
}
