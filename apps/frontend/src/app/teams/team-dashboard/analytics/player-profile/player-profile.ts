import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  statsChartOutline, 
  footballOutline, 
  peopleOutline, 
  timeOutline, 
  trophyOutline,
  trendingUpOutline,
  alertCircleOutline,
  closeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  bandageOutline,
  shirtOutline,
  helpCircleOutline
} from 'ionicons/icons';
import { AnalyticsService, PlayerProfileAnalytics } from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-player-profile-analytics',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonProgressBar,
  ],
  templateUrl: './player-profile.html',
  styleUrl: './player-profile.scss',
})
export class PlayerProfileAnalyticsComponent implements OnInit {
  @Input({ required: true }) teamId!: string;
  @Input({ required: true }) playerId!: string;

  private readonly analyticsService = inject(AnalyticsService);
  private readonly modalCtrl = inject(ModalController);

  protected profile = signal<PlayerProfileAnalytics | null>(null);
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ 
      statsChartOutline, 
      footballOutline, 
      peopleOutline, 
      timeOutline, 
      trophyOutline,
      trendingUpOutline,
      alertCircleOutline,
      closeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      bandageOutline,
      shirtOutline,
      helpCircleOutline
    });
  }

  ngOnInit() {
    void this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const profile = await firstValueFrom(this.analyticsService.getPlayerProfile(this.teamId, this.playerId));
      this.profile.set(profile);
    } catch {
      this.errorMessage.set('Failed to load player analytics.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async dismiss() {
    await this.modalCtrl.dismiss();
  }

  protected formatMinutes(seconds: number): string {
    return `${Math.floor(seconds / 60)}m`;
  }

  protected getStatusIcon(status: string): string {
    switch (status) {
      case 'present': return 'checkmark-circle-outline';
      case 'absent': return 'close-circle-outline';
      case 'tardy': return 'alert-circle-outline';
      case 'injured': return 'bandage-outline';
      default: return 'help-circle-outline';
    }
  }

  protected getStatusColor(status: string): string {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'danger';
      case 'tardy': return 'warning';
      case 'injured': return 'medium';
      default: return 'light';
    }
  }

  protected getHeatmapClass(value: number, total: number): string {
    if (!total) return 'heatmap-low';
    const ratio = value / total;
    if (ratio > 0.5) return 'heatmap-high';
    if (ratio > 0.2) return 'heatmap-mid';
    return 'heatmap-low';
  }
}
