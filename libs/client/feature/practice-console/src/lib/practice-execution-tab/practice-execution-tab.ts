import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  playOutline,
  pauseOutline,
  playSkipForwardOutline,
  playSkipBackOutline,
  refreshOutline,
  timeOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { PracticePacerService } from '@apex-team/client/data-access/drill';

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
    });
  }

  protected togglePlay() {
    if (this.pacer.isRunning()) {
      void this.pacer.pause();
    } else {
      void this.pacer.start();
    }
  }
}
