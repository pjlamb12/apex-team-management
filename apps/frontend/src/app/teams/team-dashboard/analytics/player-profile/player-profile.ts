import { Component, inject, signal, computed, Input, OnInit } from '@angular/core';
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
  IonProgressBar,
  IonToast,
  ModalController,
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
  calendarOutline,
  flashOutline,
  ribbonOutline,
  shieldOutline,
  handRightOutline,
  starOutline,
  heartOutline,
  flameOutline,
  handLeftOutline,
  sparklesOutline,
  flagOutline,
  addOutline,
  printOutline,
  trashOutline,
  createOutline,
  chatboxEllipsesOutline,
  checkmarkDoneOutline,
  arrowForwardOutline,
  documentTextOutline,
  bulbOutline,
} from 'ionicons/icons';
import {
  AnalyticsService,
  PlayerProfileAnalytics,
  TeamService,
  AwardsService,
  GoalsService,
} from '@apex-team/client/data-access/team';
import {
  PlayerAward,
  PlayerGoal,
  PlayerGoalNote,
  GoalMasteryStage,
} from '@apex-team/shared/util/models';
import { IdpGoalModalComponent } from './idp-goal-modal/idp-goal-modal';
import { IdpNoteModalComponent } from './idp-note-modal/idp-note-modal';
import { IdpGrowthCardModalComponent } from './idp-growth-card-modal/idp-growth-card-modal';

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
    IonProgressBar,
    IonToast,
  ],
  templateUrl: './player-profile.html',
  styleUrl: './player-profile.scss',
})
export class PlayerProfileAnalyticsComponent implements OnInit {
  @Input({ required: true }) teamId!: string;
  @Input({ required: true }) playerId!: string;
  @Input() initialTab: 'overview' | 'idp' | 'history' = 'overview';
  @Input() seasonId?: string;

  private readonly analyticsService = inject(AnalyticsService);
  private readonly awardsService = inject(AwardsService);
  private readonly goalsService = inject(GoalsService);
  private readonly teamService = inject(TeamService);
  private readonly modalCtrl = inject(ModalController);

  protected profile = signal<PlayerProfileAnalytics | null>(null);
  protected playerAwards = signal<PlayerAward[]>([]);
  protected playerGoals = signal<PlayerGoal[]>([]);
  protected masteredGoalsCount = computed(() => this.playerGoals().filter((g) => g.masteryStage === 'mastered').length);
  protected activeTab = signal<'overview' | 'idp' | 'history'>('overview');
  protected sportName = signal<string>('Soccer');
  protected teamName = signal<string>('Team');
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);
  protected toastMessage = signal<string>('');
  protected isToastOpen = signal(false);

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
      calendarOutline,
      flashOutline,
      ribbonOutline,
      shieldOutline,
      handRightOutline,
      starOutline,
      heartOutline,
      flameOutline,
      handLeftOutline,
      sparklesOutline,
      flagOutline,
      addOutline,
      printOutline,
      trashOutline,
      createOutline,
      chatboxEllipsesOutline,
      checkmarkDoneOutline,
      arrowForwardOutline,
      documentTextOutline,
      bulbOutline,
    });
  }

  ngOnInit() {
    if (this.initialTab) {
      this.activeTab.set(this.initialTab);
    }
    void this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [profile, team, awards, goals] = await Promise.all([
        firstValueFrom(this.analyticsService.getPlayerProfile(this.teamId, this.playerId)),
        this.teamService.getTeam(this.teamId),
        firstValueFrom(this.awardsService.getPlayerAwards(this.teamId, this.playerId)).catch(() => []),
        firstValueFrom(this.goalsService.getPlayerGoals(this.teamId, this.playerId, this.seasonId)).catch(() => []),
      ]);
      this.profile.set(profile);
      this.playerAwards.set(awards || []);
      this.playerGoals.set(goals || []);
      this.teamName.set(team.name || 'Team');
      this.sportName.set(team.sport?.name || 'Soccer');
    } catch {
      this.errorMessage.set('Failed to load player analytics.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected Math = Math;

  protected setTab(tab: 'overview' | 'idp' | 'history'): void {
    this.activeTab.set(tab);
  }

  protected async openAddGoalModal(goal?: PlayerGoal): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: IdpGoalModalComponent,
      componentProps: {
        teamId: this.teamId,
        playerId: this.playerId,
        seasonId: this.seasonId,
        goal,
      },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss<PlayerGoal | undefined>();
    if (data) {
      await this.reloadGoals();
      this.showToast(goal ? 'Goal updated successfully.' : 'New development goal created! 🎯');
    }
  }

  protected async openLogNoteModal(goal: PlayerGoal): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: IdpNoteModalComponent,
      componentProps: {
        teamId: this.teamId,
        goal,
      },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss<PlayerGoalNote | undefined>();
    if (data) {
      await this.reloadGoals();
      this.showToast('Progress observation logged! 📝');
    }
  }

  protected async openGrowthCardModal(): Promise<void> {
    const p = this.profile();
    if (!p) return;

    const modal = await this.modalCtrl.create({
      component: IdpGrowthCardModalComponent,
      componentProps: {
        teamName: this.teamName(),
        profile: p,
        goals: this.playerGoals(),
        awards: this.playerAwards(),
      },
    });
    await modal.present();
  }

  protected async advanceStage(goal: PlayerGoal, newStage: GoalMasteryStage): Promise<void> {
    try {
      await firstValueFrom(
        this.goalsService.updateGoal(this.teamId, goal.id, {
          masteryStage: newStage,
        }),
      );
      await this.reloadGoals();
      this.showToast(`Updated mastery level to ${newStage.toUpperCase()}! 🌟`);
    } catch (err) {
      console.error('Failed to advance goal stage', err);
      this.showToast('Could not update stage.');
    }
  }

  protected async deleteGoal(goal: PlayerGoal): Promise<void> {
    try {
      await firstValueFrom(this.goalsService.deleteGoal(this.teamId, goal.id));
      this.playerGoals.update((prev) => prev.filter((g) => g.id !== goal.id));
      this.showToast('Goal removed.');
    } catch (err) {
      console.error('Failed to delete goal', err);
      this.showToast('Could not remove goal.');
    }
  }

  protected async deleteGoalNote(goal: PlayerGoal, note: PlayerGoalNote): Promise<void> {
    try {
      await firstValueFrom(this.goalsService.deleteGoalNote(this.teamId, goal.id, note.id));
      await this.reloadGoals();
      this.showToast('Observation note removed.');
    } catch (err) {
      console.error('Failed to delete note', err);
      this.showToast('Could not remove note.');
    }
  }

  private async reloadGoals(): Promise<void> {
    try {
      const goals = await firstValueFrom(
        this.goalsService.getPlayerGoals(this.teamId, this.playerId, this.seasonId),
      );
      this.playerGoals.set(goals || []);
    } catch (err) {
      console.warn('Failed to reload goals', err);
    }
  }

  protected showToast(msg: string): void {
    this.toastMessage.set(msg);
    this.isToastOpen.set(true);
  }

  protected closeToast(): void {
    this.isToastOpen.set(false);
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
      case 'scheduled': return 'calendar-outline';
      default: return 'calendar-outline';
    }
  }

  protected getStatusColor(status: string): string {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'danger';
      case 'tardy': return 'warning';
      case 'injured': return 'medium';
      case 'scheduled': return 'medium';
      default: return 'medium';
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
