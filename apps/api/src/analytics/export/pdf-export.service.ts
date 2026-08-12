import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { PerformanceMetricsService } from '../performance-metrics.service';
import { PlayingTimeService } from '../playing-time.service';
import { ExportOptionsDto, ExportLayout } from '../dto/export-options.dto';

@Injectable()
export class PdfExportService {
  private readonly logger = new Logger(PdfExportService.name);

  constructor(
    private readonly performanceMetricsService: PerformanceMetricsService,
    private readonly playingTimeService: PlayingTimeService,
  ) {}

  async generate(teamId: string, options: ExportOptionsDto): Promise<Buffer> {
    const metrics = await this.performanceMetricsService.getTeamMetrics(teamId, options.seasonId);
    const playtime = await this.playingTimeService.calculateForTeam(teamId, options.seasonId);

    // Merge metrics and playtime
    const reportData = metrics.map((m) => {
      const p = playtime[m.playerId] || { totalSeconds: 0, positionSeconds: {} };
      return {
        ...m,
        playtime: p,
        playtimeFormatted: this.formatSeconds(p.totalSeconds),
        positions: Object.entries(p.positionSeconds).map(([name, seconds]) => ({
          name,
          seconds,
          formatted: this.formatSeconds(seconds),
        })),
      };
    });

    // Sort by name
    reportData.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

    const html = await this.renderTemplate({
      teamId,
      options,
      players: reportData,
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
          top: '20mm',
          right: '10mm',
          bottom: '20mm',
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
        await browser.close().catch(() => {});
      }
    }
  }

  private async launchBrowser(): Promise<puppeteer.Browser> {
    // List of candidate executable paths in order of preference
    const candidates: Array<string | undefined> = [
      process.env['PUPPETEER_EXECUTABLE_PATH'],
      // macOS standard paths
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      process.env['HOME'] ? path.join(process.env['HOME'], 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome') : undefined,
      // Linux / Docker / Container standard paths
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/snap/bin/chromium',
      // Puppeteer internal default
      undefined,
    ];

    // Filter to existing paths (while preserving undefined as the final fallback)
    const validCandidates = candidates.filter((c) => c === undefined || (typeof c === 'string' && fs.existsSync(c)));

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
        this.logger.warn(`Browser launch attempt failed with candidate '${execPath || 'default'}': ${err?.message || err}`);
        lastError = err;
      }
    }

    throw new Error(`Failed to launch browser for PDF generation. Attempted ${validCandidates.length} paths. Last error: ${lastError?.message || 'Unknown'}`);
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
                <th>Preferred Pos</th>
                <th>Playing Time</th>
                <th>Goals</th>
                <th>Assists</th>
                <th>Yellow</th>
                <th>Red</th>
            </tr>
        </thead>
        <tbody>
            {{#each players}}
            <tr>
                <td>{{jerseyNumber}}</td>
                <td>{{firstName}} {{lastName}}</td>
                <td>{{preferredPosition}}</td>
                <td>{{playtimeFormatted}}</td>
                <td>{{goals}}</td>
                <td>{{assists}}</td>
                <td>{{yellowCards}}</td>
                <td>{{redCards}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
</body>
</html>`;
  }
}
