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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  checkmarkOutline,
  chatboxEllipsesOutline,
  calendarOutline,
  footballOutline,
  fitnessOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { GoalsService, EventsService, EventEntity } from '@apex-team/client/data-access/team';
import {
  PlayerGoal,
  PlayerGoalNote,
  GoalMasteryStage,
} from '@apex-team/shared/util/models';

@Component({
  selector: 'app-idp-note-modal',
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
    IonTextarea,
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './idp-note-modal.html',
  styleUrl: './idp-note-modal.scss',
})
export class IdpNoteModalComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly goalsService = inject(GoalsService);
  private readonly eventsService = inject(EventsService);

  @Input({ required: true }) teamId!: string;
  @Input({ required: true }) goal!: PlayerGoal;

  protected readonly recentEvents = signal<EventEntity[]>([]);
  protected selectedEventId = signal<string | null>(null);
  protected selectedStage = signal<GoalMasteryStage | null>(null);
  protected noteContent = signal<string>('');

  protected readonly isLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isToastOpen = signal<boolean>(false);
  protected readonly toastMessage = signal<string>('');

  constructor() {
    addIcons({
      closeOutline,
      checkmarkOutline,
      chatboxEllipsesOutline,
      calendarOutline,
      footballOutline,
      fitnessOutline,
      sparklesOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.selectedStage.set(this.goal.masteryStage);
    await this.loadRecentEvents();
  }

  protected async loadRecentEvents(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [upcoming, past] = await Promise.all([
        firstValueFrom(this.eventsService.getEvents(this.teamId, 'upcoming')).catch(() => []),
        firstValueFrom(this.eventsService.getEvents(this.teamId, 'past')).catch(() => []),
      ]);
      const allEvents = [...(upcoming || []), ...(past || [])];
      // Sort by scheduledAt descending and take top 20
      const sorted = allEvents.sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      );
      this.recentEvents.set(sorted.slice(0, 20));
    } catch (err) {
      console.warn('Could not load events for tagging', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async submitNote(): Promise<void> {
    const text = this.noteContent().trim();
    if (!text) {
      this.showToast('Please enter an observation note.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const newNote = await firstValueFrom(
        this.goalsService.addGoalNote(this.teamId, this.goal.id, {
          eventId: this.selectedEventId() || undefined,
          stage: this.selectedStage() || undefined,
          note: text,
          observedAt: new Date().toISOString(),
        }),
      );

      this.dismiss(newNote);
    } catch (err) {
      console.error('Failed to log observation note', err);
      this.showToast('Failed to save observation note.');
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

  protected dismiss(result?: PlayerGoalNote): void {
    void this.modalCtrl.dismiss(result);
  }
}
