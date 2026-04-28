import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import {
  IonContent,
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
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, addOutline, trashOutline, createOutline, chevronForwardOutline, enterOutline } from 'ionicons/icons';
import { ThemeToggle } from '@apex-team/client/ui/theme-toggle';
import { TeamService } from '@apex-team/client/data-access/team';

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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    ThemeToggle,
  ],
  templateUrl: './teams-list.html',
  styleUrl: './teams-list.scss',
})
export class TeamsList {
  private readonly teamService = inject(TeamService);
  protected readonly alertCtrl = inject(AlertController);
  private readonly modalCtrl = inject(ModalController);

  protected teams = signal<Team[]>([]);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ peopleOutline, addOutline, trashOutline, createOutline, chevronForwardOutline, enterOutline });
  }

  ionViewWillEnter(): void {
    void this.loadTeams();
  }

  protected async loadTeams(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await this.teamService.getTeams();
      this.teams.set(data);
    } catch {
      this.errorMessage.set('Failed to load teams. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async openJoinModal(): Promise<void> {
    // We'll implement this in the next task
    console.log('Open join modal');
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
      await this.teamService.deleteTeam(id);
      await this.loadTeams();
    } catch {
      this.errorMessage.set('Failed to delete team. Please try again.');
    }
  }
}
