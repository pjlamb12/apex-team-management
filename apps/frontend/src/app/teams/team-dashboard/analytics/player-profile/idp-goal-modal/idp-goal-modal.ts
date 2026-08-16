import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  checkmarkOutline,
  flagOutline,
  sparklesOutline,
  bulbOutline,
  fitnessOutline,
  footballOutline,
  shieldCheckmarkOutline,
  chatboxEllipsesOutline,
  timeOutline,
} from 'ionicons/icons';
import { GoalsService } from '@apex-team/client/data-access/team';
import {
  PlayerGoal,
  GoalCategory,
  GoalMasteryStage,
  GoalTimeframe,
  DEFAULT_GOAL_PRESETS,
  GoalPresetDefinition,
} from '@apex-team/shared/util/models';

@Component({
  selector: 'app-idp-goal-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
    IonToast,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './idp-goal-modal.html',
  styleUrl: './idp-goal-modal.scss',
})
export class IdpGoalModalComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly goalsService = inject(GoalsService);

  @Input({ required: true }) teamId!: string;
  @Input({ required: true }) playerId!: string;
  @Input() seasonId?: string;
  @Input() goal?: PlayerGoal;

  protected readonly presets: GoalPresetDefinition[] = DEFAULT_GOAL_PRESETS;

  protected title = signal<string>('');
  protected category = signal<GoalCategory>('technical');
  protected timeframe = signal<GoalTimeframe>('full_season');
  protected masteryStage = signal<GoalMasteryStage>('emerging');
  protected baselineAssessment = signal<string>('');
  protected description = signal<string>('');

  protected readonly isEditing = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isToastOpen = signal<boolean>(false);
  protected readonly toastMessage = signal<string>('');

  constructor() {
    addIcons({
      closeOutline,
      checkmarkOutline,
      flagOutline,
      sparklesOutline,
      bulbOutline,
      fitnessOutline,
      footballOutline,
      shieldCheckmarkOutline,
      chatboxEllipsesOutline,
      timeOutline,
    });
  }

  ngOnInit(): void {
    if (this.goal) {
      this.isEditing.set(true);
      this.title.set(this.goal.title);
      this.category.set(this.goal.category);
      this.timeframe.set(this.goal.timeframe);
      this.masteryStage.set(this.goal.masteryStage);
      this.baselineAssessment.set(this.goal.baselineAssessment || '');
      this.description.set(this.goal.description || '');
    }
  }

  protected applyPreset(preset: GoalPresetDefinition): void {
    this.title.set(preset.title);
    this.category.set(preset.category);
    this.timeframe.set(preset.defaultTimeframe);
    if (!this.description()) {
      this.description.set(preset.description);
    }
    if (!this.baselineAssessment()) {
      this.baselineAssessment.set(`Focus Area: ${preset.suggestedFocus}`);
    }
  }

  protected async saveGoal(): Promise<void> {
    const titleVal = this.title().trim();
    if (!titleVal) {
      this.showToast('Please enter a goal title.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      if (this.isEditing() && this.goal) {
        const updated = await firstValueFrom(
          this.goalsService.updateGoal(this.teamId, this.goal.id, {
            title: titleVal,
            category: this.category(),
            timeframe: this.timeframe(),
            masteryStage: this.masteryStage(),
            baselineAssessment: this.baselineAssessment().trim() || undefined,
            description: this.description().trim() || undefined,
          }),
        );
        this.dismiss(updated);
      } else {
        const created = await firstValueFrom(
          this.goalsService.createGoal(this.teamId, this.playerId, {
            playerId: this.playerId,
            seasonId: this.seasonId,
            title: titleVal,
            category: this.category(),
            timeframe: this.timeframe(),
            masteryStage: this.masteryStage(),
            baselineAssessment: this.baselineAssessment().trim() || undefined,
            description: this.description().trim() || undefined,
          }),
        );
        this.dismiss(created);
      }
    } catch (err) {
      console.error('Failed to save goal', err);
      this.showToast('Failed to save development goal.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected showToast(msg: string): void {
    this.toastMessage.set(msg);
    this.isToastOpen.set(true);
  }

  protected closeToast(): void {
    this.isToastOpen.set(false);
  }

  protected dismiss(result?: PlayerGoal): void {
    void this.modalCtrl.dismiss(result);
  }
}
