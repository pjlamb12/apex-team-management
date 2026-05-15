import { Controller, Get, Param, UseGuards, ParseUUIDPipe, Query, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { PlayingTimeService } from './playing-time.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { PlayerAnalyticsService } from './player-analytics.service';
import { CsvExportService } from './export/csv-export.service';
import { PdfExportService } from './export/pdf-export.service';
import { ExportOptionsDto } from './dto/export-options.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId')
export class AnalyticsController {
  constructor(
    private readonly playingTimeService: PlayingTimeService,
    private readonly performanceMetricsService: PerformanceMetricsService,
    private readonly playerAnalyticsService: PlayerAnalyticsService,
    private readonly csvExportService: CsvExportService,
    private readonly pdfExportService: PdfExportService,
  ) {}

  @Get('events/:eventId/analytics/playing-time')
  getPlayingTime(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.playingTimeService.calculateForEvent(eventId);
  }

  @Get('analytics/performance')
  getPerformanceMetrics(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.performanceMetricsService.getTeamMetrics(teamId, seasonId);
  }

  @Get('analytics/playing-time')
  getTeamPlayingTime(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.playingTimeService.calculateForTeam(teamId, seasonId);
  }

  @Get('players/:playerId/analytics')
  getPlayerProfile(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.playerAnalyticsService.getPlayerProfile(playerId, teamId, seasonId);
  }

  @Get('analytics/export/csv')
  async exportCsv(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query() options: ExportOptionsDto,
    @Res() res: Response,
  ) {
    const csv = await this.csvExportService.generate(teamId, options);
    
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="team-analytics-${teamId}.csv"`,
    });
    
    return res.send(csv);
  }

  @Get('analytics/export/pdf')
  async exportPdf(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query() options: ExportOptionsDto,
    @Res() res: Response,
  ) {
    const pdf = await this.pdfExportService.generate(teamId, options);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="team-analytics-${teamId}.pdf"`,
      'Content-Length': pdf.length,
    });
    
    return res.send(pdf);
  }
}
