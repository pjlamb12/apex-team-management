import { Injectable } from '@nestjs/common';
import { EventEntity } from '../entities/event.entity';

@Injectable()
export class ICalService {
  generate(teamName: string, events: EventEntity[]): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Apex Team//NONSGML v1.0//EN',
      `X-WR-CALNAME:${teamName} Schedule`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const event of events) {
      if (!event.scheduledAt) continue;

      const start = event.scheduledAt;
      const duration = event.durationMinutes || 60;
      const end = new Date(start.getTime() + duration * 60000);

      const summary = event.type === 'game' 
        ? `Game vs ${event.opponent || 'TBD'}` 
        : `Practice: ${teamName}`;

      let description = '';
      if (event.type === 'game') {
        description += `Uniform: ${event.uniformColor || 'TBD'}\\n`;
        description += `${event.isHomeGame ? 'Home' : 'Away'} Game\\n`;
      }
      if (event.notes) {
        description += `Notes: ${event.notes}`;
      }

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.id}@apex-team.app`);
      lines.push(`DTSTAMP:${this.formatDate(new Date())}`);
      lines.push(`DTSTART:${this.formatDate(start)}`);
      lines.push(`DTEND:${this.formatDate(end)}`);
      lines.push(`SUMMARY:${summary}`);
      if (description) lines.push(`DESCRIPTION:${description}`);
      if (event.location) lines.push(`LOCATION:${event.location}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}
