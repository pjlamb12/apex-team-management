import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  playOutline,
  pauseOutline,
  playSkipForwardOutline,
  playSkipBackOutline,
  refreshOutline,
  timeOutline,
  alertCircleOutline,
  chevronDownOutline,
} from 'ionicons/icons';
import { PracticePacerService } from '@apex-team/client/data-access/drill';
import { EventsService } from '@apex-team/client/data-access/team';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-practice-execution-tab',
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton],
  templateUrl: './practice-execution-tab.html',
  styleUrl: './practice-execution-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeExecutionTab {
  protected readonly pacer = inject(PracticePacerService);
  private readonly route = inject(ActivatedRoute);
  private readonly eventsService = inject(EventsService);

  protected teamId = this.route.snapshot.params['id'] || this.route.parent?.snapshot.params['id'];
  protected eventId = this.route.snapshot.params['eventId'] || this.route.parent?.snapshot.params['eventId'];

  protected readonly formattedTime = computed(() => {
    const totalSeconds = this.pacer.remainingSeconds();
    const isOvertime = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${isOvertime ? '-' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  protected readonly timerColor = computed(() => {
    const seconds = this.pacer.remainingSeconds();
    if (seconds < 0) return 'danger';
    if (seconds < 60) return 'warning';
    return 'ap-text';
  });

  constructor() {
    addIcons({
      playOutline,
      pauseOutline,
      playSkipForwardOutline,
      playSkipBackOutline,
      refreshOutline,
      timeOutline,
      alertCircleOutline,
      chevronDownOutline,
    });
  }

  protected async togglePlay() {
    if (this.pacer.isRunning()) {
      await this.pacer.pause();
    } else {
      await this.pacer.start();
    }
    await this.updateBackend();
  }

  protected async previous() {
    this.pacer.previous();
    await this.updateBackend();
  }

  protected async next() {
    this.pacer.next();
    await this.updateBackend();
  }

  protected async reset() {
    this.pacer.reset();
    await this.updateBackend();
  }

  private async updateBackend() {
    if (this.teamId && this.eventId) {
      await firstValueFrom(
        this.eventsService.updateEvent(this.teamId, this.eventId, {
          clockStartTime: this.pacer.startTime() ? new Date(this.pacer.startTime()!).toISOString() : null,
          clockAccumulatedMs: this.pacer.accumulatedMs(),
          currentPeriod: this.pacer.activeDrillIndex() + 1, // 1-indexed for DB
        })
      );
    }
  }
}
