import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PdfExportService } from './pdf-export.service';
import { PerformanceMetricsService } from '../performance-metrics.service';
import { PlayingTimeService } from '../playing-time.service';
import { ExportOptionsDto, ExportFormat, ExportLayout } from '../dto/export-options.dto';
import { TeamEntity } from '../../entities/team.entity';
import { SeasonEntity } from '../../entities/season.entity';
import { LeagueEntity } from '../../entities/league.entity';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PdfExportService', () => {
  let service: PdfExportService;
  let metricsService: PerformanceMetricsService;
  let playingTimeService: PlayingTimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfExportService,
        {
          provide: getRepositoryToken(TeamEntity),
          useValue: {
            findOne: vi.fn().mockResolvedValue({ id: 'team-1', name: 'Apex Raptors', sport: { name: 'Soccer' } }),
          },
        },
        {
          provide: getRepositoryToken(SeasonEntity),
          useValue: {
            findOne: vi.fn().mockResolvedValue({ id: 's1', name: 'Fall 2026' }),
          },
        },
        {
          provide: getRepositoryToken(LeagueEntity),
          useValue: {
            findOne: vi.fn().mockResolvedValue({ id: 'l1', name: 'State Cup' }),
          },
        },
        {
          provide: PerformanceMetricsService,
          useValue: {
            getTeamMetrics: vi.fn().mockResolvedValue([
              {
                playerId: 'p1',
                firstName: 'John',
                lastName: 'Doe',
                goals: 1,
                assists: 2,
                yellowCards: 0,
                redCards: 0,
                gamesPlayed: 5,
                blockedShots: 0,
                blockedPenaltyKicks: 0,
              },
            ]),
          },
        },
        {
          provide: PlayingTimeService,
          useValue: {
            calculateForTeam: vi.fn().mockResolvedValue({
              p1: {
                playerId: 'p1',
                totalSeconds: 3600,
                positionSeconds: { Midfield: 3600 },
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PdfExportService>(PdfExportService);
    metricsService = module.get<PerformanceMetricsService>(PerformanceMetricsService);
    playingTimeService = module.get<PlayingTimeService>(PlayingTimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a PDF buffer with enriched stats', async () => {
    const options: ExportOptionsDto = {
      format: ExportFormat.PDF,
      layout: ExportLayout.OVERVIEW,
      includeVisuals: true,
    };

    // Mock generatePdf to avoid puppeteer launch in unit tests
    vi.spyOn(service as any, 'generatePdf').mockResolvedValue(Buffer.from('PDF_CONTENT'));
    const renderSpy = vi.spyOn(service as any, 'renderTemplate');

    const buffer = await service.generate('team-1', options);

    expect(buffer).toBeDefined();
    expect(buffer.toString()).toBe('PDF_CONTENT');
    expect(renderSpy).toHaveBeenCalled();

    const renderData = renderSpy.mock.calls[0][0];
    expect(renderData.teamId).toBe('team-1');
    expect(renderData.teamName).toBe('Apex Raptors');
    expect(renderData.sportName).toBe('Soccer');
    expect(renderData.isOverview).toBe(true);
    expect(renderData.players).toHaveLength(1);
    expect(renderData.players[0].firstName).toBe('John');
    expect(renderData.players[0].goals).toBe(1);
    expect(renderData.players[0].assists).toBe(2);
    expect(renderData.players[0].points).toBe(3);
    expect(renderData.players[0].minutes).toBe(60);
    expect(renderData.players[0].mpg).toBe('12.0');
    expect(renderData.players[0].playtimeFormatted).toBe('60m 0s');
  });

  it('should support different layouts', async () => {
    vi.spyOn(service as any, 'generatePdf').mockResolvedValue(Buffer.from('PDF_CONTENT'));
    const renderSpy = vi.spyOn(service as any, 'renderTemplate');

    await service.generate('team-1', {
      format: ExportFormat.PDF,
      layout: ExportLayout.PLAYER_PACK,
    } as any);

    expect(renderSpy.mock.calls[0][0].isPlayerPack).toBe(true);
    expect(renderSpy.mock.calls[0][0].isOverview).toBe(false);

    await service.generate('team-1', {
      format: ExportFormat.PDF,
      layout: ExportLayout.TABULAR,
    } as any);

    expect(renderSpy.mock.calls[1][0].isTabular).toBe(true);
  });
});
