import { Controller, Get, Param, UseGuards, ParseUUIDPipe, Query, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { PlayingTimeService } from './playing-time.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { PlayerAnalyticsService } from './player-analytics.service';
import { CsvExportService } from './export/csv-export.service';
import { PdfExportService } from './export/pdf-export.service';
import { LlmExportService } from './export/llm-export.service';
import { ExportOptionsDto } from './dto/export-options.dto';
import { LlmExportOptionsDto, LlmExportFormat } from './dto/llm-export-options.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller('teams/:teamId')
export class AnalyticsController {
  constructor(
    private readonly playingTimeService: PlayingTimeService,
    private readonly performanceMetricsService: PerformanceMetricsService,
    private readonly playerAnalyticsService: PlayerAnalyticsService,
    private readonly csvExportService: CsvExportService,
    private readonly pdfExportService: PdfExportService,
    private readonly llmExportService: LlmExportService,
  ) {}

  @Get('events/:eventId/analytics/playing-time')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  getPlayingTime(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.playingTimeService.calculateForEvent(eventId);
  }

  @Get('analytics/performance')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  getPerformanceMetrics(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('seasonId') seasonId?: string,
    @Query('leagueId') leagueId?: string,
    @Query('eventType') eventType?: 'game' | 'practice' | 'all',
  ) {
    return this.performanceMetricsService.getTeamMetrics(teamId, seasonId, leagueId, eventType);
  }

  @Get('analytics/playing-time')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  getTeamPlayingTime(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('seasonId') seasonId?: string,
    @Query('leagueId') leagueId?: string,
  ) {
    return this.playingTimeService.calculateForTeam(teamId, seasonId, leagueId);
  }

  @Get('players/:playerId/analytics')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  getPlayerProfile(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.playerAnalyticsService.getPlayerProfile(playerId, teamId, seasonId);
  }

  @Get('analytics/export/csv')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
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
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
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

  @Get('analytics/export/llm')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async exportLlm(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query() options: LlmExportOptionsDto,
    @Res() res: Response,
  ) {
    const result = await this.llmExportService.generate(teamId, options);

    if (options.format === LlmExportFormat.MARKDOWN) {
      const filename = `ai-prompt-${result.template}-${teamId}.md`;
      res.set({
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      return res.send(result.prompt);
    }

    return res.json(result);
  }
}

