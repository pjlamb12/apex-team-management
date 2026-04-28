import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

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

  async joinTeam(code: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/teams/join`, { code })
    );
  }

  async regenerateCode(teamId: string): Promise<{ joinCode: string }> {
    return firstValueFrom(
      this.http.post<{ joinCode: string }>(`${this.apiUrl}/teams/${teamId}/regenerate-code`, {})
    );
  }

  async deleteTeam(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/teams/${id}`)
    );
  }
}
