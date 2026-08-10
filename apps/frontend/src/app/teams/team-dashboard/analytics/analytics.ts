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
  IonToggle,
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
  flashOutline,
  ribbonOutline,
  shieldOutline,
  handRightOutline,
} from 'ionicons/icons';
import { 
  AnalyticsService, 
  PlayerPerformanceMetrics, 
  ParticipationStats, 
  PlayerPlaytime, 
  SeasonsService, 
  LeaguesService,
  TeamService
} from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';
import { ExportModalComponent, ExportOptions } from './export-modal/export-modal';
import { League, SeasonStats } from '@apex-team/shared/util/models';

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
    IonToggle,
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
  private readonly teamService = inject(TeamService);
  private readonly modalCtrl = inject(ModalController);

  protected performanceMetrics = signal<PlayerPerformanceMetrics[]>([]);
  protected participationStats = signal<ParticipationStats[]>([]);
  protected playingTime = signal<Record<string, PlayerPlaytime>>({});
  protected teamStats = signal<SeasonStats | null>(null);
  protected activeSegment = signal<'performance' | 'participation' | 'playtime'>('performance');
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);
  protected includeInactive = signal<boolean>(false);

  protected seasons = this.seasonsService.seasons;
  protected selectedSeasonId = this.seasonsService.selectedSeasonId;
  protected leagues = signal<League[]>([]);
  protected selectedLeagueId = signal<string | null>(null);
  protected selectedEventType = signal<'game' | 'practice' | 'all'>('game');
  protected sportName = signal<string>('Soccer');

  protected getRecordScopeLabel(): string {
    const leagueId = this.selectedLeagueId();
    if (!leagueId) {
      return 'Overall Record (All Competitions)';
    }
    const league = this.leagues().find(l => l.id === leagueId);
    return league ? `${league.name} Record` : 'Competition Record';
  }

  protected participationEventType = signal<'game' | 'practice' | 'all'>('all');
  protected selectedPlaytimePosition = signal<string>('all');

  protected filteredPerformanceMetrics = computed(() => {
    const metrics = this.performanceMetrics();
    const isFiltered = !!(this.selectedSeasonId() || this.selectedLeagueId());
    const showInactive = this.includeInactive();
    return metrics.filter(m => {
      if (m.isGuest && isFiltered && m.gamesPlayed === 0) return false;
      if (m.isActive === false && !showInactive) return false;
      return true;
    });
  });

  protected rosterPerformanceMetrics = computed(() => {
    return this.filteredPerformanceMetrics().filter(m => !m.isGuest);
  });

  protected guestPerformanceMetrics = computed(() => {
    return this.filteredPerformanceMetrics().filter(m => m.isGuest);
  });

  protected topScorers = computed(() => {
    return [...this.filteredPerformanceMetrics()]
      .filter(m => m.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
  });

  protected topAssistors = computed(() => {
    return [...this.filteredPerformanceMetrics()]
      .filter(m => m.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 5);
  });

  protected topKills = computed(() => {
    return [...this.filteredPerformanceMetrics()]
      .filter(m => (m.kills ?? 0) > 0)
      .sort((a, b) => (b.kills ?? 0) - (a.kills ?? 0))
      .slice(0, 5);
  });

  protected topAces = computed(() => {
    return [...this.filteredPerformanceMetrics()]
      .filter(m => (m.aces ?? 0) > 0)
      .sort((a, b) => (b.aces ?? 0) - (a.aces ?? 0))
      .slice(0, 5);
  });

  protected topBlocks = computed(() => {
    return [...this.filteredPerformanceMetrics()]
      .filter(m => (m.blocks ?? 0) > 0)
      .sort((a, b) => (b.blocks ?? 0) - (a.blocks ?? 0))
      .slice(0, 5);
  });

  protected topDigs = computed(() => {
    return [...this.filteredPerformanceMetrics()]
      .filter(m => (m.digs ?? 0) > 0)
      .sort((a, b) => (b.digs ?? 0) - (a.digs ?? 0))
      .slice(0, 5);
  });

  protected filteredParticipationStats = computed(() => {
    const stats = this.participationStats();
    const isFiltered = !!(this.selectedSeasonId() || this.selectedLeagueId());
    const showInactive = this.includeInactive();
    return stats.filter(p => {
      if (p.isGuest && isFiltered && p.present === 0 && p.totalEvents === 0) return false;
      if (p.isActive === false && !showInactive) return false;
      return true;
    });
  });

  protected rosterParticipationStats = computed(() => {
    return this.filteredParticipationStats().filter(p => !p.isGuest);
  });

  protected guestParticipationStats = computed(() => {
    return this.filteredParticipationStats().filter(p => p.isGuest);
  });

  protected mostCommitted = computed(() => {
    return [...this.rosterParticipationStats()]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  });

  protected teamAverage = computed(() => {
    const stats = this.filteredParticipationStats();
    const activePlayers = stats.filter(s => s.totalEvents > 0);
    if (activePlayers.length === 0) return 100;
    
    const sum = activePlayers.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / activePlayers.length);
  });

  protected availablePlaytimePositions = computed(() => {
    const pt = this.playingTime();
    const posSet = new Set<string>();
    Object.values(pt).forEach(p => {
      Object.keys(p.positionSeconds || {}).forEach(pos => posSet.add(pos));
    });
    return Array.from(posSet).sort();
  });

  protected rosterPlaytime = computed(() => {
    const pt = this.playingTime();
    const metrics = this.performanceMetrics();
    const isFiltered = !!(this.selectedSeasonId() || this.selectedLeagueId());
    const targetPos = this.selectedPlaytimePosition();
    const showInactive = this.includeInactive();

    return Object.values(pt)
      .filter(p => {
        const m = metrics.find(m => m.playerId === p.playerId);
        const isGuest = m?.isGuest ?? false;
        if (isGuest) return false;
        if (m?.isActive === false && !showInactive) return false;
        if (isFiltered && p.totalSeconds === 0) return false;
        if (targetPos !== 'all' && (p.positionSeconds[targetPos] || 0) === 0) return false;
        return true;
      })
      .sort((a, b) => {
        if (targetPos !== 'all') {
          return (b.positionSeconds[targetPos] || 0) - (a.positionSeconds[targetPos] || 0);
        }
        return b.totalSeconds - a.totalSeconds;
      });
  });

  protected isPlayerInactive(playerId: string): boolean {
    const metric = this.performanceMetrics().find(m => m.playerId === playerId);
    return metric?.isActive === false;
  }

  protected guestPlaytime = computed(() => {
    const pt = this.playingTime();
    const metrics = this.performanceMetrics();
    const isFiltered = !!(this.selectedSeasonId() || this.selectedLeagueId());
    const targetPos = this.selectedPlaytimePosition();

    return Object.values(pt)
      .filter(p => {
        const m = metrics.find(m => m.playerId === p.playerId);
        const isGuest = m?.isGuest ?? false;
        if (!isGuest) return false;
        if (isFiltered && p.totalSeconds === 0) return false;
        if (targetPos !== 'all' && (p.positionSeconds[targetPos] || 0) === 0) return false;
        return true;
      })
      .sort((a, b) => {
        if (targetPos !== 'all') {
          return (b.positionSeconds[targetPos] || 0) - (a.positionSeconds[targetPos] || 0);
        }
        return b.totalSeconds - a.totalSeconds;
      });
  });

  protected getPlayerMinutes(playerId: string): number {
    const pt = this.playingTime()[playerId];
    return pt ? Math.round(pt.totalSeconds / 60) : 0;
  }

  protected getPlayerMPG(playerId: string, gamesPlayed: number): string {
    if (gamesPlayed === 0) return '0m';
    const totalMinutes = this.getPlayerMinutes(playerId);
    return `${Math.round(totalMinutes / gamesPlayed)}m`;
  }

  protected getGoalsPerGame(goals: number, gamesPlayed: number): string {
    if (gamesPlayed === 0) return '.00';
    return (goals / gamesPlayed).toFixed(2);
  }

  protected onParticipationTypeChange(type: 'all' | 'game' | 'practice'): void {
    this.participationEventType.set(type);
    const id = this._teamId();
    const seasonId = this.selectedSeasonId();
    const leagueId = this.selectedLeagueId();
    if (id && seasonId) {
      firstValueFrom(this.analyticsService.getParticipationStats(id, seasonId, leagueId ?? undefined, type))
        .then(stats => this.participationStats.set(stats))
        .catch(() => {
          // ignore error
        });
    }
  }

  protected maxPoints = computed(() => {
    const pt = this.playingTime();
    const values = Object.values(pt).map(p => p.totalSeconds);
    return values.length > 0 ? Math.max(...values) : 1;
  });

  protected Math = Math;

  protected getPlayerName(playerId: string): string {
    const p = this.performanceMetrics().find(m => m.playerId === playerId);
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
  }

  private lastInitializedTeamId: string | null = null;

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
      flashOutline,
      ribbonOutline,
      shieldOutline,
      handRightOutline,
    });

    // Initialize seasons if not already done
    effect(() => {
      const id = this._teamId();
      if (id && id !== this.lastInitializedTeamId) {
        this.lastInitializedTeamId = id;
        this.isLoading.set(true);
        if (this.seasonsService.seasons().length === 0) {
          this.seasonsService.initialize(id).then(() => {
            if (this.seasonsService.seasons().length === 0) {
              this.isLoading.set(false);
            }
          });
        } else {
          if (!this.seasonsService.selectedSeasonId()) {
            this.isLoading.set(false);
          }
        }
      }
    });

    // Load data whenever teamId, selectedSeasonId, selectedLeagueId or selectedEventType changes
    effect(() => {
      const id = this._teamId();
      const seasonId = this.selectedSeasonId();
      const leagueId = this.selectedLeagueId();
      const eventType = this.selectedEventType();
      if (id && seasonId) {
        void this.loadData(id, seasonId, leagueId ?? undefined, eventType);
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

  protected onEventTypeChange(event: any): void {
    this.selectedEventType.set(event.detail.value);
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

  protected async loadData(teamId: string, seasonId: string, leagueId?: string, eventType?: 'game' | 'practice' | 'all'): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [performance, participation, playingTime, team, stats] = await Promise.all([
        firstValueFrom(this.analyticsService.getPerformanceMetrics(teamId, seasonId, leagueId, eventType)),
        firstValueFrom(this.analyticsService.getParticipationStats(teamId, seasonId, leagueId, this.participationEventType())),
        firstValueFrom(this.analyticsService.getTeamPlayingTime(teamId, seasonId, leagueId)),
        this.teamService.getTeam(teamId),
        firstValueFrom(this.seasonsService.getSeasonStats(teamId, seasonId, leagueId ?? undefined)).catch(() => null)
      ]);
      this.performanceMetrics.set(performance);
      this.participationStats.set(participation);
      this.playingTime.set(playingTime);
      this.sportName.set(team.sport?.name || 'Soccer');
      this.teamStats.set(stats);
    } catch {
      this.errorMessage.set('Failed to load team analytics.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected getHittingPct(kills = 0, errors = 0, hits = 0): string {
    const attempts = hits + kills + errors;
    if (attempts === 0) return '.000';
    const pct = (kills - errors) / attempts;
    if (pct === 1) return '1.000';
    if (pct === -1) return '-1.000';
    if (pct < 0) {
      const fixed = pct.toFixed(3);
      return '-' + fixed.substring(2);
    }
    const fixed = pct.toFixed(3);
    return fixed.startsWith('0') ? fixed.substring(1) : fixed;
  }

  protected getPassAverage(passCount = 0, passScoreSum = 0): string {
    if (passCount === 0) return '-';
    return (passScoreSum / passCount).toFixed(2);
  }

  protected formatMinutes(seconds: number): string {
    return `${Math.floor(seconds / 60)}m`;
  }

  protected getParticipationColor(percentage: number, totalEvents: number): string {
    if (totalEvents === 0) return 'warning';
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
