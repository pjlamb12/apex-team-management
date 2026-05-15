import { Test, TestingModule } from '@nestjs/testing';
import { CsvExportService } from './csv-export.service';
import { PerformanceMetricsService } from '../performance-metrics.service';
import { PlayingTimeService } from '../playing-time.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEntity } from '../../entities/event.entity';
import { ExportFormat, ExportGranularity } from '../dto/export-options.dto';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('CsvExportService', () => {
  let service: CsvExportService;
  let performanceMetricsService: PerformanceMetricsService;
  let playingTimeService: PlayingTimeService;
  let eventRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsvExportService,
        {
          provide: PerformanceMetricsService,
          useValue: {
            getTeamMetrics: vi.fn(),
            getEventMetrics: vi.fn(),
          },
        },
        {
          provide: PlayingTimeService,
          useValue: {
            calculateForTeam: vi.fn(),
            calculateForEvent: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(EventEntity),
          useValue: {
            find: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CsvExportService>(CsvExportService);
    performanceMetricsService = module.get<PerformanceMetricsService>(PerformanceMetricsService);
    playingTimeService = module.get<PlayingTimeService>(PlayingTimeService);
    eventRepo = module.get(getRepositoryToken(EventEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    const teamId = 'team-1';

    it('should generate aggregated CSV', async () => {
      vi.spyOn(performanceMetricsService, 'getTeamMetrics').mockResolvedValue([
        { playerId: 'p1', firstName: 'John', lastName: 'Doe', goals: 1, assists: 1, yellowCards: 0, redCards: 0, gamesPlayed: 1 }
      ] as any);
      vi.spyOn(playingTimeService, 'calculateForTeam').mockResolvedValue({
        p1: { playerId: 'p1', totalSeconds: 3600, positionSeconds: {} }
      } as any);

      const result = await service.generate(teamId, { format: ExportFormat.CSV, granularity: ExportGranularity.AGGREGATED });
      
      expect(result).toContain('"Player Name","Goals","Assists","Yellow Cards","Red Cards","Games Played","Total Minutes"');
      expect(result).toContain('"John Doe",1,1,0,0,1,60');
    });

    it('should generate per-game CSV', async () => {
      const mockEvent = { id: 'e1', scheduledAt: new Date('2024-01-01'), opponent: 'Rivals' };
      vi.spyOn(eventRepo, 'find').mockResolvedValue([mockEvent]);
      vi.spyOn(performanceMetricsService, 'getEventMetrics').mockResolvedValue([
        { playerId: 'p1', firstName: 'John', lastName: 'Doe', goals: 1, assists: 0, yellowCards: 0, redCards: 0, gamesPlayed: 1 }
      ] as any);
      vi.spyOn(playingTimeService, 'calculateForEvent').mockResolvedValue({
        p1: { playerId: 'p1', totalSeconds: 1800, positionSeconds: {} }
      } as any);

      const result = await service.generate(teamId, { format: ExportFormat.CSV, granularity: ExportGranularity.PER_GAME });
      
      expect(result).toContain('"Date","Opponent","Player Name","Goals","Assists","Yellow Cards","Red Cards","Minutes Played"');
      expect(result).toContain('"2024-01-01","Rivals","John Doe",1,0,0,0,30');
    });
  });
});
