import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { PlayingTimeService } from './playing-time.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { PlayerAnalyticsService } from './player-analytics.service';
import { CsvExportService } from './export/csv-export.service';
import { PdfExportService } from './export/pdf-export.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportLayout, ExportFormat } from './dto/export-options.dto';
import { Response } from 'express';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let pdfExportService: PdfExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: PlayingTimeService, useValue: {} },
        { provide: PerformanceMetricsService, useValue: {} },
        { provide: PlayerAnalyticsService, useValue: {} },
        { provide: CsvExportService, useValue: {} },
        {
          provide: PdfExportService,
          useValue: {
            generate: vi.fn().mockResolvedValue(Buffer.from('PDF_CONTENT')),
          },
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    pdfExportService = module.get<PdfExportService>(PdfExportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('exportPdf should call service and set response headers', async () => {
    const res = {
      set: vi.fn(),
      send: vi.fn(),
    } as unknown as Response;

    const options = {
      format: ExportFormat.PDF,
      layout: ExportLayout.OVERVIEW,
    };

    await controller.exportPdf('team-1', options as any, res);

    expect(pdfExportService.generate).toHaveBeenCalledWith('team-1', options);
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="team-analytics-team-1.pdf"',
    }));
    expect(res.send).toHaveBeenCalledWith(Buffer.from('PDF_CONTENT'));
  });
});
