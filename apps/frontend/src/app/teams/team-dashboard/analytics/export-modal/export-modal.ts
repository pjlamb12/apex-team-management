import { Component, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, downloadOutline, shareOutline } from 'ionicons/icons';
import { ModalController } from '@ionic/angular/standalone';

export type ExportFormat = 'pdf' | 'csv';
export type ExportLayout = 'overview' | 'player-pack' | 'tabular';
export type ExportGranularity = 'aggregated' | 'per-game';

export interface ExportOptions {
  format: ExportFormat;
  layout?: ExportLayout;
  granularity?: ExportGranularity;
  includeVisuals: boolean;
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
  ],
  templateUrl: './export-modal.html',
})
export class ExportModalComponent {
  private readonly modalCtrl = inject(ModalController);

  @Input() teamId!: string;

  protected options = signal<ExportOptions>({
    format: 'pdf',
    layout: 'overview',
    granularity: 'aggregated',
    includeVisuals: true,
  });

  constructor() {
    addIcons({ closeOutline, downloadOutline, shareOutline });
  }

  protected updateOption<K extends keyof ExportOptions>(key: K, value: ExportOptions[K]): void {
    this.options.update((opt) => ({ ...opt, [key]: value }));
  }

  protected cancel(): void {
    void this.modalCtrl.dismiss();
  }

  protected confirm(): void {
    void this.modalCtrl.dismiss(this.options());
  }
}
