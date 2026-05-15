import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

export interface AttendanceRecord {
  id: string;
  eventId: string;
  playerId: string;
  status: 'present' | 'absent' | 'tardy' | 'injured';
  notes?: string;
  player?: {
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getAttendance(teamId: string, eventId: string): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/attendance`);
  }

  updateAttendance(teamId: string, eventId: string, data: { playerId: string; status: string; notes?: string }): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/attendance`, data);
  }

  batchUpdateAttendance(teamId: string, eventId: string, data: { playerIds?: string[]; status: string }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/attendance/batch`, data);
  }

  syncFromLineup(teamId: string, eventId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/attendance/sync`, {});
  }
}
