import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

export interface CreateTeamDto {
  name: string;
  sportId: string;
}

export interface UpdateTeamDto {
  name?: string;
  homeLocationId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  async getTeams(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/teams`)
    );
  }

  async getTeam(id: string): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/teams/${id}`)
    );
  }

  async createTeam(data: CreateTeamDto): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/teams`, data)
    );
  }

  async updateTeam(id: string, data: UpdateTeamDto): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(`${this.apiUrl}/teams/${id}`, data)
    );
  }

  async joinTeam(code: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/teams/join`, { code })
    );
  }

  async regenerateCode(teamId: string): Promise<{ joinCode: string }> {
    return firstValueFrom(
      this.http.post<{ joinCode: string }>(`${this.apiUrl}/teams/${teamId}/code/regenerate`, {})
    );
  }

  async regenerateCalendarSecret(teamId: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/teams/${teamId}/calendar/regenerate`, {})
    );
  }

  async deleteTeam(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/teams/${id}`)
    );
  }

  async seedDemoTeam(): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/teams/seed-demo`, {})
    );
  }
}
