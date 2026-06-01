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
  IonButton,
  IonSelect,
  IonSelectOption,
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
import { 
  AnalyticsService, 
  PlayerPerformanceMetrics, 
  ParticipationStats, 
  PlayerPlaytime, 
  SeasonsService, 
  LeaguesService 
} from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';
import { ExportModalComponent, ExportOptions } from './export-modal/export-modal';
import { League } from '@apex-team/shared/util/models';

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
    IonSelect,
    IonSelectOption,
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
  private readonly seasonsService = inject(SeasonsService);
  private readonly leaguesService = inject(LeaguesService);
  private readonly modalCtrl = inject(ModalController);

  protected performanceMetrics = signal<PlayerPerformanceMetrics[]>([]);
  protected participationStats = signal<ParticipationStats[]>([]);
  protected playingTime = signal<Record<string, PlayerPlaytime>>({});
  protected activeSegment = signal<'performance' | 'participation' | 'playtime'>('performance');
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);

  protected seasons = this.seasonsService.seasons;
  protected selectedSeasonId = this.seasonsService.selectedSeasonId;
  protected leagues = signal<League[]>([]);
  protected selectedLeagueId = signal<string | null>(null);

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

    // Load data whenever teamId, selectedSeasonId or selectedLeagueId changes
    effect(() => {
      const id = this._teamId();
      const seasonId = this.selectedSeasonId();
      const leagueId = this.selectedLeagueId();
      if (id && seasonId) {
        void this.loadData(id, seasonId, leagueId ?? undefined);
      }
    });

    // Load leagues whenever season changes
    effect(() => {
      const seasonId = this.selectedSeasonId();
      if (seasonId) {
        void this.loadLeagues(seasonId);
      } else {
        this.leagues.set([]);
      }
    });
  }

  protected async loadLeagues(seasonId: string): Promise<void> {
    try {
      const data = await firstValueFrom(this.leaguesService.findAllForSeason(seasonId));
      this.leagues.set(data);
    } catch {
      console.error('Failed to load leagues');
    }
  }

  protected onSeasonChange(event: any): void {
    this.seasonsService.selectedSeasonId.set(event.detail.value);
    this.selectedLeagueId.set(null);
  }

  protected onLeagueChange(event: any): void {
    this.selectedLeagueId.set(event.detail.value);
  }

  protected async openExportModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExportModalComponent,
      componentProps: {
        teamId: this.teamId,
        seasonId: this.selectedSeasonId(),
        leagueId: this.selectedLeagueId(),
      },
      breakpoints: [0, 0.7, 0.9],
      initialBreakpoint: 0.7,
      handle: true,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss<ExportOptions>();
    if (data) {
      console.log('Export data:', data);
    }
  }

  protected async loadData(teamId: string, seasonId: string, leagueId?: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [performance, participation, playingTime] = await Promise.all([
        firstValueFrom(this.analyticsService.getPerformanceMetrics(teamId, seasonId, leagueId)),
        firstValueFrom(this.analyticsService.getParticipationStats(teamId, seasonId, leagueId)),
        firstValueFrom(this.analyticsService.getTeamPlayingTime(teamId, seasonId, leagueId))
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

  protected getHeatmapClass(value: number, total: number): string {
    const ratio = value / total;
    if (ratio > 0.5) return 'heatmap-high';
    if (ratio > 0.2) return 'heatmap-mid';
    return 'heatmap-low';
  }
}
