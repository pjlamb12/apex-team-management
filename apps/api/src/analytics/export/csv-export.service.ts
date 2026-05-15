import { Injectable } from '@nestjs/common';
import { Parser } from 'json2csv';
import { PerformanceMetricsService } from '../performance-metrics.service';
import { PlayingTimeService } from '../playing-time.service';
import { ExportOptionsDto, ExportGranularity } from '../dto/export-options.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEntity } from '../../entities/event.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CsvExportService {
  constructor(
    private readonly performanceMetricsService: PerformanceMetricsService,
    private readonly playingTimeService: PlayingTimeService,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
  ) {}

  async generate(teamId: string, options: ExportOptionsDto): Promise<string> {
    if (options.granularity === ExportGranularity.PER_GAME) {
      return this.generatePerGame(teamId, options.seasonId);
    }
    return this.generateAggregated(teamId, options.seasonId);
  }

  private async generateAggregated(teamId: string, seasonId?: string): Promise<string> {
    const metrics = await this.performanceMetricsService.getTeamMetrics(teamId, seasonId);
    const playtimes = await this.playingTimeService.calculateForTeam(teamId, seasonId);

    const data = metrics.map((m) => {
      const playtime = playtimes[m.playerId];
      return {
        'Player Name': `${m.firstName} ${m.lastName}`,
        Goals: m.goals,
        Assists: m.assists,
        'Yellow Cards': m.yellowCards,
        'Red Cards': m.redCards,
        'Games Played': m.gamesPlayed,
        'Total Minutes': playtime ? Math.floor(playtime.totalSeconds / 60) : 0,
      };
    });

    const fields = [
      'Player Name',
      'Goals',
      'Assists',
      'Yellow Cards',
      'Red Cards',
      'Games Played',
      'Total Minutes',
    ];
    const opts = { fields };
    const parser = new Parser(opts);
    return parser.parse(data);
  }

  private async generatePerGame(teamId: string, seasonId?: string): Promise<string> {
    const events = await this.eventRepo.find({
      where: seasonId ? { seasonId, type: 'game' } : { season: { teamId }, type: 'game' },
      order: { scheduledAt: 'ASC' },
      relations: ['season', 'season.team'],
    });

    const allData: any[] = [];

    for (const event of events) {
      const metrics = await this.performanceMetricsService.getEventMetrics(teamId, event.id);
      const playtimes = await this.playingTimeService.calculateForEvent(event.id);

      metrics.forEach((m) => {
        const playtime = playtimes[m.playerId];
        // Only include players who were present or had some stats/time
        if (m.gamesPlayed > 0 || (playtime && playtime.totalSeconds > 0)) {
          allData.push({
            Date: event.scheduledAt ? event.scheduledAt.toISOString().split('T')[0] : 'N/A',
            Opponent: event.opponent || 'N/A',
            'Player Name': `${m.firstName} ${m.lastName}`,
            Goals: m.goals,
            Assists: m.assists,
            'Yellow Cards': m.yellowCards,
            'Red Cards': m.redCards,
            'Minutes Played': playtime ? Math.floor(playtime.totalSeconds / 60) : 0,
          });
        }
      });
    }

    const fields = [
      'Date',
      'Opponent',
      'Player Name',
      'Goals',
      'Assists',
      'Yellow Cards',
      'Red Cards',
      'Minutes Played',
    ];
    const opts = { fields };
    const parser = new Parser(opts);
    return parser.parse(allData);
  }
}
