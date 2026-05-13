import { Component, inject, signal, effect, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
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
  IonSegment,
  IonSegmentButton,
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
  downloadOutline,
} from 'ionicons/icons';
import { AnalyticsService, PlayerPerformanceMetrics, ParticipationStats, PlayerPlaytime } from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';
import { ExportModalComponent, ExportOptions } from './export-modal/export-modal';

@Component({
  selector: 'app-team-analytics',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
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
    IonSegment,
    IonSegmentButton,
    IonProgressBar,
    IonButton,
  ],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class TeamAnalytics {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  public get teamId(): string {
    return this._teamId() ?? '';
  }

  private readonly analyticsService = inject(AnalyticsService);
  private readonly modalCtrl = inject(ModalController);

  protected performanceMetrics = signal<PlayerPerformanceMetrics[]>([]);
  protected participationStats = signal<ParticipationStats[]>([]);
  protected playingTime = signal<Record<string, PlayerPlaytime>>({});
  protected activeSegment = signal<'performance' | 'participation' | 'playtime'>('performance');
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);

  protected topScorers = computed(() => {
    return [...this.performanceMetrics()]
      .filter(m => m.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
  });

  protected topAssistors = computed(() => {
    return [...this.performanceMetrics()]
      .filter(m => m.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 5);
  });

  protected mostCommitted = computed(() => {
    return [...this.participationStats()]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  });

  protected topWorkhorses = computed(() => {
    const pt = this.playingTime();
    return Object.values(pt)
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 5);
  });

  protected getPlayerName(playerId: string): string {
    const p = this.performanceMetrics().find(m => m.playerId === playerId);
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
  }

  constructor() {
    addIcons({ 
      statsChartOutline, 
      footballOutline, 
      peopleOutline, 
      timeOutline, 
      trophyOutline,
      trendingUpOutline,
      alertCircleOutline,
      downloadOutline,
    });

    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadData(id);
      }
    });
  }

  protected async openExportModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExportModalComponent,
      componentProps: {
        teamId: this.teamId,
      },
      breakpoints: [0, 0.6, 0.9],
      initialBreakpoint: 0.6,
      handle: true,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss<ExportOptions>();
    if (data) {
      console.log('Export data:', data);
      // Implementation of actual export will follow in Task 2
    }
  }

  protected async loadData(teamId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [performance, participation, playingTime] = await Promise.all([
        firstValueFrom(this.analyticsService.getPerformanceMetrics(teamId)),
        firstValueFrom(this.analyticsService.getParticipationStats(teamId)),
        firstValueFrom(this.analyticsService.getTeamPlayingTime(teamId))
      ]);
      this.performanceMetrics.set(performance);
      this.participationStats.set(participation);
      this.playingTime.set(playingTime);
    } catch {
      this.errorMessage.set('Failed to load team analytics.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected formatMinutes(seconds: number): string {
    return `${Math.floor(seconds / 60)}m`;
  }

  protected getParticipationColor(percentage: number): string {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'primary';
    if (percentage >= 50) return 'warning';
    return 'danger';
  }
}
