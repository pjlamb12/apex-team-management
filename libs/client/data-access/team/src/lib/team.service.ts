import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { OfflineStorageService, NetworkStatusService } from '@apex-team/client/data-access/offline';

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
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly network = inject(NetworkStatusService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  async getTeams(): Promise<any[]> {
    if (!this.network.isOnline()) {
      return this.offlineStorage.getAll<any>(this.offlineStorage.STORES.TEAMS);
    }

    try {
      const teams = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/teams`)
      );
      this.offlineStorage.saveAll(this.offlineStorage.STORES.TEAMS, teams);
      return teams;
    } catch {
      return this.offlineStorage.getAll<any>(this.offlineStorage.STORES.TEAMS);
    }
  }

  async getTeam(id: string): Promise<any> {
    if (!this.network.isOnline()) {
      return this.offlineStorage.getById<any>(this.offlineStorage.STORES.TEAMS, id);
    }

    try {
      const team = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/teams/${id}`)
      );
      this.offlineStorage.save(this.offlineStorage.STORES.TEAMS, team);
      return team;
    } catch {
      return this.offlineStorage.getById<any>(this.offlineStorage.STORES.TEAMS, id);
    }
  }

  async createTeam(data: CreateTeamDto): Promise<any> {
    const created = await firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/teams`, data)
    );
    this.offlineStorage.save(this.offlineStorage.STORES.TEAMS, created);
    return created;
  }

  async updateTeam(id: string, data: UpdateTeamDto): Promise<any> {
    const updated = await firstValueFrom(
      this.http.patch<any>(`${this.apiUrl}/teams/${id}`, data)
    );
    this.offlineStorage.save(this.offlineStorage.STORES.TEAMS, updated);
    return updated;
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
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/teams/${id}`)
    );
    await this.offlineStorage.remove(this.offlineStorage.STORES.TEAMS, id);
  }

  async seedDemoTeam(sport: string = 'Soccer'): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/teams/seed-demo`, { sport })
    );
  }
}
