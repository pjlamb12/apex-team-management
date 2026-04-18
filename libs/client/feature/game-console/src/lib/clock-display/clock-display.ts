import { Component, inject, computed } from '@angular/core';
import { LiveClockService } from '../live-clock.service';
import { intervalToDuration } from 'date-fns';

@Component({
  selector: 'app-clock-display',
  templateUrl: './clock-display.html',
})
export class ClockDisplay {
  private readonly clockService = inject(LiveClockService);

  protected readonly formattedTime = computed(() => {
    const ms = this.clockService.elapsedMs();
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
