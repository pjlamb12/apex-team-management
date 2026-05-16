import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

export type CandidateStatus = 'interested' | 'invited' | 'offered' | 'accepted' | 'declined';
export type CandidateAttendanceStatus = 'present' | 'absent' | 'tardy';

export interface CandidateEntity {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  parentName?: string;
  parentEmail: string;
  parentPhone?: string;
  preferredPosition?: string;
  notes?: string;
  status: CandidateStatus;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateAttendanceEntity {
  id: string;
  candidateId: string;
  candidate?: CandidateEntity;
  eventId: string;
  status: CandidateAttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CandidatesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getCandidates(teamId: string): Observable<CandidateEntity[]> {
    return this.http.get<CandidateEntity[]>(`${this.apiUrl}/teams/${teamId}/candidates`);
  }

  getCandidate(teamId: string, id: string): Observable<CandidateEntity> {
    return this.http.get<CandidateEntity>(`${this.apiUrl}/teams/${teamId}/candidates/${id}`);
  }

  addCandidate(teamId: string, data: Partial<CandidateEntity>): Observable<CandidateEntity> {
    return this.http.post<CandidateEntity>(`${this.apiUrl}/teams/${teamId}/candidates`, data);
  }

  updateCandidate(teamId: string, id: string, data: Partial<CandidateEntity>): Observable<CandidateEntity> {
    return this.http.put<CandidateEntity>(`${this.apiUrl}/teams/${teamId}/candidates/${id}`, data);
  }

  deleteCandidate(teamId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teams/${teamId}/candidates/${id}`);
  }

  getAttendance(teamId: string, eventId: string): Observable<CandidateAttendanceEntity[]> {
    return this.http.get<CandidateAttendanceEntity[]>(`${this.apiUrl}/teams/${teamId}/candidates/events/${eventId}/attendance`);
  }

  markAttendance(teamId: string, candidateId: string, eventId: string, status: CandidateAttendanceStatus, notes?: string): Observable<CandidateAttendanceEntity> {
    return this.http.post<CandidateAttendanceEntity>(`${this.apiUrl}/teams/${teamId}/candidates/${candidateId}/events/${eventId}/attendance`, { status, notes });
  }

  promoteCandidate(teamId: string, id: string, seasonId?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/teams/${teamId}/candidates/${id}/promote`, { seasonId });
  }
}
