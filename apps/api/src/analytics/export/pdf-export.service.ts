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
    const reportData = metrics.map(m => {
      const p = playtime[m.playerId] || { totalSeconds: 0, positionSeconds: {} };
      return {
        ...m,
        playtime: p,
        playtimeFormatted: this.formatSeconds(p.totalSeconds),
        positions: Object.entries(p.positionSeconds).map(([name, seconds]) => ({
          name,
          seconds,
          formatted: this.formatSeconds(seconds)
        }))
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
    // Try both development path and potential production paths
    const possiblePaths = [
      path.join(__dirname, 'templates', 'report.hbs'),
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
      throw new Error(`Template not found in any of: ${possiblePaths.join(', ')}`);
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
      let executablePath = process.env['PUPPETEER_EXECUTABLE_PATH'];
      
      if (!executablePath) {
        const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (fs.existsSync(macPath)) {
          executablePath = macPath;
        }
      }

      browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--font-render-hinting=none'
        ],
      });
      const page = await browser.newPage();
      
      // Set viewport for better rendering
      await page.setViewport({ width: 1200, height: 800 });
      
      await page.setContent(html, { waitUntil: 'load' });
      
      // Add Tailwind CSS
      await page.addStyleTag({
        url: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
      });

      // Wait a bit for Tailwind to be applied
      await new Promise(resolve => setTimeout(resolve, 500));

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
    } catch (error) {
      this.logger.error(`Failed to generate PDF: ${error.message}`, error.stack);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private formatSeconds(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
}
