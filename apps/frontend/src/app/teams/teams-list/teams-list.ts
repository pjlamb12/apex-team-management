import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AlertController } from '@ionic/angular/standalone';
import {
  IonContent,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonBadge,
  IonText,
} from '@ionic/angular/standalone';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { addIcons } from 'ionicons';
import { peopleOutline, addOutline, trashOutline, createOutline, chevronForwardOutline } from 'ionicons/icons';

interface Sport {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  sport: Sport;
}

@Component({
  selector: 'app-teams-list',
  standalone: true,
  imports: [
    RouterLink,
    IonContent,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonBadge,
    IonText,
  ],
  templateUrl: './teams-list.html',
  styleUrl: './teams-list.scss',
})
export class TeamsList {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  protected readonly alertCtrl = inject(AlertController);

  protected teams = signal<Team[]>([]);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  constructor() {
    addIcons({ peopleOutline, addOutline, trashOutline, createOutline, chevronForwardOutline });
  }

  ionViewWillEnter(): void {
    void this.loadTeams();
  }

  protected async loadTeams(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<Team[]>(`${this.apiUrl}/teams`)
      );
      this.teams.set(data);
    } catch {
      this.errorMessage.set('Failed to load teams. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async confirmDelete(team: Team): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Team',
      message: `Are you sure you want to delete ${team.name}? This cannot be undone.`,
      buttons: [
        { text: 'Keep Team', role: 'cancel' },
        {
          text: 'Delete Team',
          role: 'destructive',
          cssClass: 'text-danger',
          handler: () => {
            void this.deleteTeam(team.id);
          },
        },
      ],
    });
    await alert.present();
  }

  private async deleteTeam(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/teams/${id}`)
      );
      await this.loadTeams();
    } catch {
      this.errorMessage.set('Failed to delete team. Please try again.');
    }
  }
}
