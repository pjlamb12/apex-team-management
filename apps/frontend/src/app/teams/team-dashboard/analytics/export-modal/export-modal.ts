import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonFooter,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, downloadOutline, shareOutline, chevronDownOutline } from 'ionicons/icons';
import { ModalController, Platform } from '@ionic/angular/standalone';
import { AnalyticsService, SeasonsService, LeaguesService } from '@apex-team/client/data-access/team';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Season, League } from '@apex-team/shared/util/models';

export type ExportFormat = 'pdf' | 'csv';
export type ExportLayout = 'overview' | 'player-pack' | 'tabular';
export type ExportGranularity = 'aggregated' | 'per-game';

export interface ExportOptions {
  format: ExportFormat;
  layout?: ExportLayout;
  granularity?: ExportGranularity;
  includeVisuals: boolean;
  seasonId?: string;
  leagueId?: string;
}

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonFooter,
    IonIcon,
    IonSpinner,
  ],
  templateUrl: './export-modal.html',
})
export class ExportModalComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly platform = inject(Platform);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly seasonsService = inject(SeasonsService);
  private readonly leaguesService = inject(LeaguesService);

  @Input() teamId!: string;
  @Input() seasonId?: string;
  @Input() leagueId?: string;

  protected options = signal<ExportOptions>({
    format: 'pdf',
    layout: 'overview',
    granularity: 'aggregated',
    includeVisuals: true,
  });

  protected seasons = this.seasonsService.seasons;
  protected leagues = signal<League[]>([]);
  protected isExporting = signal(false);

  constructor() {
    addIcons({ closeOutline, downloadOutline, shareOutline, chevronDownOutline });
  }

  ngOnInit() {
    if (this.seasonId) {
      this.updateOption('seasonId', this.seasonId);
      void this.loadLeagues(this.seasonId);
    }
    if (this.leagueId) {
      this.updateOption('leagueId', this.leagueId);
    }
  }

  protected async loadLeagues(seasonId: string) {
    try {
      const leagues = await firstValueFrom(this.leaguesService.findAllForSeason(seasonId));
      this.leagues.set(leagues);
    } catch {
      console.error('Failed to load leagues for export');
    }
  }

  protected onSeasonChange(event: any) {
    const id = event.detail.value;
    this.updateOption('seasonId', id);
    this.updateOption('leagueId', undefined);
    void this.loadLeagues(id);
  }

  protected updateOption<K extends keyof ExportOptions>(key: K, value: ExportOptions[K]): void {
    this.options.update((opt) => ({ ...opt, [key]: value }));
  }

  protected cancel(): void {
    void this.modalCtrl.dismiss();
  }

  protected async confirm(): Promise<void> {
    this.isExporting.set(true);
    try {
      const options = this.options();
      const blob = await firstValueFrom(this.analyticsService.exportData(this.teamId, options));
      const filename = `team-analytics-${this.teamId}-${new Date().getTime()}.${options.format}`;

      if (this.platform.is('capacitor')) {
        await this.exportMobile(blob, filename);
      } else {
        this.exportWeb(blob, filename);
      }
      void this.modalCtrl.dismiss(options);
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      this.isExporting.set(false);
    }
  }

  private exportWeb(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private async exportMobile(blob: Blob, filename: string): Promise<void> {
    const base64Data = await this.blobToBase64(blob);
    
    const savedFile = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'Team Analytics Export',
      text: 'Sharing team analytics report.',
      url: savedFile.uri,
      dialogTitle: 'Share Export',
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
