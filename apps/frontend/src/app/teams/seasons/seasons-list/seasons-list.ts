import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  IonNote,
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
import { SeasonsService } from '../seasons.service';
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
    IonNote,
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
export class SeasonsList implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seasonsService = inject(SeasonsService);
  protected readonly alertCtrl = inject(AlertController);

  protected teamId = signal<string | null>(null);
  protected seasons = signal<Season[]>([]);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ addOutline, trashOutline, createOutline, calendarOutline });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.teamId.set(id);
      void this.loadSeasons();
    }
  }

  protected async loadSeasons(): Promise<void> {
    const id = this.teamId();
    if (!id) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await firstValueFrom(this.seasonsService.findAllForTeam(id));
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
      await this.loadSeasons();
    } catch (error: any) {
      const msg = error?.error?.message || 'Failed to delete season. Please try again.';
      this.errorMessage.set(msg);
    }
  }
}
