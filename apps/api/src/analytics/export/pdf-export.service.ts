import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { PerformanceMetricsService } from '../performance-metrics.service';
import { PlayingTimeService } from '../playing-time.service';
import { ExportOptionsDto, ExportLayout } from '../dto/export-options.dto';
import { TeamEntity } from '../../entities/team.entity';
import { SeasonEntity } from '../../entities/season.entity';
import { LeagueEntity } from '../../entities/league.entity';

@Injectable()
export class PdfExportService {
  private readonly logger = new Logger(PdfExportService.name);

  constructor(
    private readonly performanceMetricsService: PerformanceMetricsService,
    private readonly playingTimeService: PlayingTimeService,
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(SeasonEntity)
    private readonly seasonRepo: Repository<SeasonEntity>,
    @InjectRepository(LeagueEntity)
    private readonly leagueRepo: Repository<LeagueEntity>,
  ) {}

  async generate(teamId: string, options: ExportOptionsDto): Promise<Buffer> {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['sport'],
    });

    let season: SeasonEntity | null = null;
    if (options.seasonId) {
      season = await this.seasonRepo.findOne({ where: { id: options.seasonId, teamId } });
    }

    let league: LeagueEntity | null = null;
    if (options.leagueId) {
      league = await this.leagueRepo.findOne({ where: { id: options.leagueId } });
    }

    const metrics = await this.performanceMetricsService.getTeamMetrics(
      teamId,
      options.seasonId,
      options.leagueId,
    );
    const playtime = await this.playingTimeService.calculateForTeam(
      teamId,
      options.seasonId,
      options.leagueId,
    );

    let totalGoals = 0;
    let totalAssists = 0;
    let totalSeconds = 0;

    // Merge metrics and playtime with full current stats
    const reportData = metrics.map((m) => {
      const p = playtime[m.playerId] || { totalSeconds: 0, positionSeconds: {} };
      const playerSec = p.totalSeconds || 0;
      const mins = Math.round(playerSec / 60);
      const gp = m.gamesPlayed || 0;
      const goals = m.goals || 0;
      const assists = m.assists || 0;
      const points = goals + assists;
      const shotSaves = (m.blockedShots || 0) + (m.blockedPenaltyKicks || 0);

      totalGoals += goals;
      totalAssists += assists;
      totalSeconds += playerSec;

      const positions = Object.entries(p.positionSeconds || {}).map(([name, seconds]) => {
        const sec = Number(seconds) || 0;
        const pct = playerSec > 0 ? Math.round((sec / playerSec) * 100) : 0;
        return {
          name,
          seconds: sec,
          minutes: Math.round(sec / 60),
          formatted: this.formatSeconds(sec),
          percentage: pct,
        };
      });

      return {
        ...m,
        jerseyNumber: m.jerseyNumber != null ? `#${m.jerseyNumber}` : '-',
        preferredPosition: m.preferredPosition || 'Flexible',
        isGuest: !!m.isGuest,
        isActive: m.isActive !== false,
        gamesPlayed: gp,
        totalSeconds: playerSec,
        minutes: mins,
        playtimeFormatted: this.formatSeconds(playerSec),
        mpg: gp > 0 ? (playerSec / 60 / gp).toFixed(1) : '0.0',
        goals,
        assists,
        points,
        goalsPerGame: gp > 0 ? (goals / gp).toFixed(2) : '0.00',
        assistsPerGame: gp > 0 ? (assists / gp).toFixed(2) : '0.00',
        shotSaves,
        yellowCards: m.yellowCards || 0,
        redCards: m.redCards || 0,
        cardsFormatted: `${m.yellowCards || 0} / ${m.redCards || 0}`,
        positions,
        // Volleyball metrics
        kills: m.kills || 0,
        hits: m.hits || 0,
        hittingErrors: m.hittingErrors || 0,
        hittingPct:
          m.hits && m.hits > 0 ? (((m.kills || 0) - (m.hittingErrors || 0)) / m.hits).toFixed(3) : '.000',
        setAttempts: m.setAttempts || 0,
        setAssists: m.setAssists || 0,
        setErrors: m.setErrors || 0,
        passCount: m.passCount || 0,
        passAverage:
          m.passCount && m.passCount > 0 ? ((m.passScoreSum || 0) / m.passCount).toFixed(2) : '-',
        aces: m.aces || 0,
        serviceErrors: m.serviceErrors || 0,
        digs: m.digs || 0,
        blocks: m.blocks || 0,
        blockTouches: m.blockTouches || 0,
      };
    });

    // Sort by name
    reportData.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

    const scopeParts: string[] = [];
    if (season) scopeParts.push(`Season: ${season.name}`);
    if (league) scopeParts.push(`Tournament: ${league.name}`);

    let layoutTitle = 'Team Overview';
    if (options.layout === ExportLayout.PLAYER_PACK) layoutTitle = 'Full Player Pack';
    if (options.layout === ExportLayout.TABULAR) layoutTitle = 'Tabular Summary';

    const html = await this.renderTemplate({
      teamId,
      teamName: team?.name || 'Apex Team',
      sportName: team?.sport?.name || 'Soccer',
      scopeLabel: scopeParts.join(' • '),
      layoutTitle,
      options,
      players: reportData,
      totalGoals,
      totalAssists,
      totalMinutes: Math.round(totalSeconds / 60),
      generatedAt: new Date().toLocaleString(),
      isOverview: options.layout === ExportLayout.OVERVIEW,
      isPlayerPack: options.layout === ExportLayout.PLAYER_PACK,
      isTabular: options.layout === ExportLayout.TABULAR,
    });

    return this.generatePdf(html);
  }

  private async renderTemplate(data: any): Promise<string> {
    const possiblePaths = [
      path.join(__dirname, 'templates', 'report.hbs'),
      path.join(__dirname, '..', 'templates', 'report.hbs'),
      path.join(process.cwd(), 'templates', 'report.hbs'),
      path.join(process.cwd(), 'dist/apps/api/templates/report.hbs'),
      path.join(process.cwd(), 'apps/api/src/analytics/export/templates/report.hbs'),
    ];

    let templateSource = '';
    let found = false;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        templateSource = fs.readFileSync(p, 'utf8');
        found = true;
        break;
      }
    }

    if (!found) {
      this.logger.warn(`Report template file not found on disk, using built-in template fallback.`);
      templateSource = this.getFallbackTemplate();
    }

    const template = handlebars.compile(templateSource);

    // Register helpers
    handlebars.registerHelper('formatDuration', (seconds: number) => this.formatSeconds(seconds));
    handlebars.registerHelper('eq', (a, b) => a === b);

    return template(data);
  }

  private async generatePdf(html: string): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    try {
      browser = await this.launchBrowser();

      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });

      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      // Load Tailwind CSS with safety fallback
      try {
        await page.addStyleTag({
          url: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (cssError) {
        this.logger.warn('Could not load external Tailwind CSS for PDF generation', cssError);
      }

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm',
        },
        timeout: 30000,
      });

      return Buffer.from(pdfBuffer);
    } catch (error: any) {
      this.logger.error(`Failed to generate PDF: ${error?.message || error}`, error?.stack);
      throw error;
    } finally {
      if (browser) {
        await browser.close().catch((err) => {
          this.logger.warn(`Failed closing browser: ${err?.message}`);
        });
      }
    }
  }

  private async launchBrowser(): Promise<puppeteer.Browser> {
    const candidates: Array<string | undefined> = [
      process.env['PUPPETEER_EXECUTABLE_PATH'],
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      process.env['HOME']
        ? path.join(process.env['HOME'], 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
        : undefined,
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/snap/bin/chromium',
      undefined,
    ];

    const validCandidates = candidates.filter(
      (c) => c === undefined || (typeof c === 'string' && fs.existsSync(c)),
    );

    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions',
      '--font-render-hinting=none',
    ];

    let lastError: any = null;

    for (const execPath of validCandidates) {
      try {
        const options: Parameters<typeof puppeteer.launch>[0] = {
          headless: true,
          args: launchArgs,
        };
        if (execPath) {
          options.executablePath = execPath;
        }

        const browser = await puppeteer.launch(options);
        return browser;
      } catch (err: any) {
        this.logger.warn(
          `Browser launch attempt failed with candidate '${execPath || 'default'}': ${err?.message || err}`,
        );
        lastError = err;
      }
    }

    throw new Error(
      `Failed to launch browser for PDF generation. Attempted ${validCandidates.length} paths. Last error: ${lastError?.message || 'Unknown'}`,
    );
  }

  private formatSeconds(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  private getFallbackTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Team Analytics Report</title>
    <style>
        @page { size: A4; margin: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; -webkit-print-color-adjust: exact; padding: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
        th { background-color: #f8fafc; font-weight: 700; color: #475569; }
        h1 { color: #1e293b; font-size: 24px; margin-bottom: 4px; }
        .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Apex Team Analytics Report</h1>
    <div class="meta">Generated: {{generatedAt}} | Team ID: {{teamId}}</div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Player</th>
                <th>Pos</th>
                <th>GP</th>
                <th>MIN</th>
                <th>MPG</th>
                <th>Goals</th>
                <th>Assists</th>
                <th>PTS</th>
                <th>G/G</th>
                <th>Saves</th>
                <th>Cards (Y/R)</th>
            </tr>
        </thead>
        <tbody>
            {{#each players}}
            <tr>
                <td>{{jerseyNumber}}</td>
                <td>{{firstName}} {{lastName}}</td>
                <td>{{preferredPosition}}</td>
                <td>{{gamesPlayed}}</td>
                <td>{{minutes}}m</td>
                <td>{{mpg}}m</td>
                <td>{{goals}}</td>
                <td>{{assists}}</td>
                <td>{{points}}</td>
                <td>{{goalsPerGame}}</td>
                <td>{{shotSaves}}</td>
                <td>{{cardsFormatted}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
</body>
</html>`;
  }
}
