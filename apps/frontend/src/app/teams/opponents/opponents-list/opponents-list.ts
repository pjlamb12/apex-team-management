import { Component, inject, signal, effect, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  shieldOutline,
  warningOutline,
  trendingUpOutline,
  calendarOutline,
  footballOutline,
  chevronForwardOutline,
  peopleOutline,
  eyeOutline,
} from 'ionicons/icons';
import { OpponentsService } from '@apex-team/client/data-access/team';
import { OpponentWithStats, ThreatLevel } from '@apex-team/shared/util/models';
import { EmptyState } from '@apex-team/client/ui/empty-state';
import { OpponentModal } from '../opponent-modal/opponent-modal';

@Component({
  selector: 'app-opponents-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonSpinner,
    EmptyState,
  ],
  templateUrl: './opponents-list.html',
  styleUrl: './opponents-list.scss',
})
export class OpponentsList {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  public get teamId(): string {
    return this._teamId() || this.route.parent?.snapshot.paramMap.get('id') || '';
  }

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly opponentsService = inject(OpponentsService);
  private readonly modalCtrl = inject(ModalController);

  protected opponents = signal<OpponentWithStats[]>([]);
  protected isLoading = signal(false);
  protected searchQuery = signal<string>('');
  protected selectedThreatFilter = signal<string>('all');

  // Aggregated Stats
  protected totalOpponents = computed(() => this.opponents().length);
  protected totalMatches = computed(() =>
    this.opponents().reduce((acc, o) => acc + (o.headToHead?.totalGames || 0), 0),
  );
  protected totalWins = computed(() =>
    this.opponents().reduce((acc, o) => acc + (o.headToHead?.wins || 0), 0),
  );
  protected totalGoalsFor = computed(() =>
    this.opponents().reduce((acc, o) => acc + (o.headToHead?.goalsFor || 0), 0),
  );
  protected totalGoalsAgainst = computed(() =>
    this.opponents().reduce((acc, o) => acc + (o.headToHead?.goalsAgainst || 0), 0),
  );
  protected overallWinPercentage = computed(() => {
    const total = this.totalMatches();
    if (total === 0) return 0;
    return Math.round((this.totalWins() / total) * 100);
  });

  // Filtered Opponents
  protected filteredOpponents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const threat = this.selectedThreatFilter();

    return this.opponents().filter((opp) => {
      const matchesQuery =
        !query ||
        opp.name.toLowerCase().includes(query) ||
        (opp.coachName && opp.coachName.toLowerCase().includes(query)) ||
        (opp.formation && opp.formation.toLowerCase().includes(query)) ||
        (opp.tendencies && opp.tendencies.toLowerCase().includes(query));

      const matchesThreat = threat === 'all' || opp.threatLevel === threat;

      return matchesQuery && matchesThreat;
    });
  });

  constructor() {
    addIcons({
      addOutline,
      shieldOutline,
      warningOutline,
      trendingUpOutline,
      calendarOutline,
      footballOutline,
      chevronForwardOutline,
      peopleOutline,
      eyeOutline,
    });

    effect(() => {
      const id = this.teamId;
      if (id) {
        void this.loadOpponents(id);
      }
    });
  }

  ionViewWillEnter(): void {
    const id = this.teamId;
    if (id) {
      void this.loadOpponents(id);
    }
  }

  protected async loadOpponents(teamId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const list = await firstValueFrom(this.opponentsService.getOpponents(teamId));
      this.opponents.set(list);
    } catch {
      console.error('Failed to load opponents');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onSearchChange(event: any): void {
    this.searchQuery.set(event.detail.value || '');
  }

  protected setThreatFilter(filter: string): void {
    this.selectedThreatFilter.set(filter);
  }

  protected async openNewOpponentModal(): Promise<void> {
    const teamId = this.teamId;
    if (!teamId) return;

    const modal = await this.modalCtrl.create({
      component: OpponentModal,
      componentProps: { teamId },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'saved' && data) {
      await this.loadOpponents(teamId);
    }
  }

  protected onEmptyStateAction(): void {
    if (this.searchQuery() || this.selectedThreatFilter() !== 'all') {
      this.searchQuery.set('');
      this.selectedThreatFilter.set('all');
    } else {
      void this.openNewOpponentModal();
    }
  }

  protected navigateToDossier(opponentId: string): void {
    void this.router.navigate(['/teams', this.teamId, 'opponents', opponentId]);
  }

  protected getThreatBadgeClass(threatLevel?: ThreatLevel | null): string {
    switch (threatLevel) {
      case 'critical':
        return 'bg-red-500/20 text-red-500 border border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-500 border border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  }
}
