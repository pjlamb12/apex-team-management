import { Component, inject, signal, OnDestroy } from '@angular/core';
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
import { peopleOutline, addOutline, trashOutline, createOutline, chevronForwardOutline, personAddOutline } from 'ionicons/icons';
import { ThemeToggle } from '@apex-team/client/ui/theme-toggle';
import { TeamService } from '@apex-team/client/data-access/team';
import { SocketService } from '../../shared/services/socket.service';
import { JoinTeamModal } from '../join-team/join-team-modal';

interface Sport {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  sport: Sport;
  role?: 'HEAD_COACH' | 'ASSISTANT';
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
export class TeamsList implements OnDestroy {
  private readonly teamService = inject(TeamService);
  protected readonly alertCtrl = inject(AlertController);
  private readonly modalCtrl = inject(ModalController);
  private readonly socketService = inject(SocketService);

  protected teams = signal<Team[]>([]);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);
  private tapTimestamps: number[] = [];

  constructor() {
    addIcons({ peopleOutline, addOutline, trashOutline, createOutline, chevronForwardOutline, personAddOutline });

    this.socketService.onEvent('eventCreated', () => {
      void this.loadTeams();
    });
  }

  ionViewWillEnter(): void {
    void this.loadTeams();
  }

  ngOnDestroy(): void {
    this.socketService.offEvent('eventCreated');
    // Leave all team rooms
    this.teams().forEach(team => {
      this.socketService.leaveTeam(team.id);
    });
  }

  protected async loadTeams(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await this.teamService.getTeams();
      this.teams.set(data);
      // Join rooms for all teams to get notifications
      data.forEach(team => {
        this.socketService.joinTeam(team.id);
      });
    } catch {
      this.errorMessage.set('Failed to load teams. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async openJoinModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: JoinTeamModal,
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.joined) {
      await this.loadTeams();
    }
  }

  protected async onHeaderTap(): Promise<void> {
    const now = Date.now();
    this.tapTimestamps.push(now);
    if (this.tapTimestamps.length > 5) {
      this.tapTimestamps.shift();
    }

    if (this.tapTimestamps.length === 5) {
      const firstTap = this.tapTimestamps[0];
      const duration = now - firstTap;
      if (duration <= 2000) {
        this.tapTimestamps = [];
        await this.showSeedDemoAlert();
      }
    }
  }

  private async showSeedDemoAlert(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Generate Demo Team?',
      message: 'This will seed a new demo team "Apex Rangers FC (Demo)" with a complete season, league, players, lineups, and past/future events. Proceed?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Generate',
          handler: () => {
            void this.generateDemoTeam();
          },
        },
      ],
    });
    await alert.present();
  }

  private async generateDemoTeam(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.teamService.seedDemoTeam();
      await this.loadTeams();
    } catch {
      this.errorMessage.set('Failed to generate demo team. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async confirmDelete(event: Event, team: Team): Promise<void> {
    event.stopPropagation();
    event.preventDefault();
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
