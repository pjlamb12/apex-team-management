import { Component, inject, signal, effect, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AlertController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, createOutline, calendarOutline } from 'ionicons/icons';
import { SeasonsService } from '@apex-team/client/data-access/team';
import { Season } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-seasons-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonText,
    DatePipe,
  ],
  templateUrl: './seasons-list.html',
  styleUrl: './seasons-list.scss',
})
export class SeasonsList {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  public get teamId(): string {
    return this._teamId() ?? '';
  }

  private readonly seasonsService = inject(SeasonsService);
  protected readonly alertCtrl = inject(AlertController);

  protected seasons = signal<Season[]>([]);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ addOutline, trashOutline, createOutline, calendarOutline });

    // Load seasons whenever teamId changes
    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadSeasons(id);
      }
    });
  }

  protected async loadSeasons(teamId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await firstValueFrom(this.seasonsService.findAllForTeam(teamId));
      this.seasons.set(data);
    } catch {
      this.errorMessage.set('Failed to load seasons. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async confirmDelete(season: Season): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Season',
      message: `Are you sure you want to delete ${season.name}? This cannot be undone.`,
      buttons: [
        { text: 'Keep Season', role: 'cancel' },
        {
          text: 'Delete Season',
          role: 'destructive',
          cssClass: 'text-danger',
          handler: () => {
            void this.deleteSeason(season.id);
          },
        },
      ],
    });
    await alert.present();
  }

  private async deleteSeason(id: string): Promise<void> {
    try {
      await firstValueFrom(this.seasonsService.remove(id));
      const teamId = this.teamId;
      if (teamId) {
        await this.loadSeasons(teamId);
      }
    } catch (error: any) {
      const msg = error?.error?.message || 'Failed to delete season. Please try again.';
      this.errorMessage.set(msg);
    }
  }
}
