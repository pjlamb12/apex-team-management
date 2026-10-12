import { Component, inject, computed } from '@angular/core';
import { LiveClockService } from '../live-clock.service';
import { LiveGameStateService } from '../live-game-state.service';
import { intervalToDuration } from 'date-fns';

@Component({
  selector: 'app-clock-display',
  standalone: true,
  imports: [],
  templateUrl: './clock-display.html',
})
export class ClockDisplayComponent {
  private readonly clockService = inject(LiveClockService);
  private readonly stateService = inject(LiveGameStateService);

  protected readonly currentPeriod = this.stateService.currentPeriod;

  protected readonly isCountdown = computed(() => {
    return this.stateService.sportName() === 'Basketball';
  });

  protected readonly periodLengthMs = computed(() => {
    const mins = this.stateService.periodLengthMinutes() || 8;
    return mins * 60 * 1000;
  });

  protected readonly isPeriodFinished = computed(() => {
    if (!this.isCountdown()) return false;
    const ms = this.clockService.elapsedMs();
    const periodLen = this.periodLengthMs();
    return ms > 0 && ms % periodLen === 0;
  });

  protected readonly periodLabel = computed(() => {
    const period = this.currentPeriod();
    const sport = this.stateService.sportName();
    if (sport === 'Basketball') {
      return `Q${period}`;
    }
    return `P${period}`;
  });

  protected readonly formattedTime = computed(() => {
    const ms = this.clockService.elapsedMs();
    if (this.isCountdown()) {
      const periodLen = this.periodLengthMs();
      if (ms === 0) {
        return this.formatDuration(periodLen);
      }
      const elapsedInPeriod = ms % periodLen;
      if (elapsedInPeriod === 0) {
        return '00:00';
      }
      const remainingMs = Math.max(0, periodLen - elapsedInPeriod);
      return this.formatDuration(remainingMs);
    }
    return this.formatDuration(ms);
  });

  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const duration = intervalToDuration({ start: 0, end: ms });

    const hours = duration.hours ?? 0;
    const minutes = duration.minutes ?? 0;
    const seconds = duration.seconds ?? 0;

    if (hours > 0 || totalSeconds >= 3600) {
      return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0'),
      ].join(':');
    }

    return [
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].join(':');
  }
}
