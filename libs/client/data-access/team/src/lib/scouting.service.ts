import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

export interface ScoutingRubricEntity {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateEvaluationEntity {
  id: string;
  candidateId: string;
  eventId?: string;
  rubricId: string;
  coachId: string;
  rating: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  rubric?: ScoutingRubricEntity;
  coach?: any; // Simplified for now
  event?: any;
}

@Injectable({
  providedIn: 'root',
})
export class ScoutingService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  // Rubrics
  getRubrics(teamId: string): Observable<ScoutingRubricEntity[]> {
    return this.http.get<ScoutingRubricEntity[]>(`${this.apiUrl}/teams/${teamId}/scouting/rubrics`);
  }

  addRubric(teamId: string, data: Partial<ScoutingRubricEntity>): Observable<ScoutingRubricEntity> {
    return this.http.post<ScoutingRubricEntity>(`${this.apiUrl}/teams/${teamId}/scouting/rubrics`, data);
  }

  updateRubric(teamId: string, id: string, data: Partial<ScoutingRubricEntity>): Observable<ScoutingRubricEntity> {
    return this.http.put<ScoutingRubricEntity>(`${this.apiUrl}/teams/${teamId}/scouting/rubrics/${id}`, data);
  }

  deleteRubric(teamId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teams/${teamId}/scouting/rubrics/${id}`);
  }

  // Evaluations
  getEvaluations(teamId: string, candidateId: string): Observable<CandidateEvaluationEntity[]> {
    return this.http.get<CandidateEvaluationEntity[]>(`${this.apiUrl}/teams/${teamId}/scouting/candidates/${candidateId}/evaluations`);
  }

  recordEvaluation(teamId: string, data: Partial<CandidateEvaluationEntity>): Observable<CandidateEvaluationEntity> {
    return this.http.post<CandidateEvaluationEntity>(`${this.apiUrl}/teams/${teamId}/scouting/evaluations`, data);
  }
}
