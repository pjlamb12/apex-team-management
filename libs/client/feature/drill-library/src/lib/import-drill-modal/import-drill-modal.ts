import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonTextarea,
  IonLabel,
  IonItem,
  IonIcon,
  IonSpinner,
  IonNote,
  IonText,
  IonList,
  IonChip,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentOutline, checkmarkCircleOutline, alertCircleOutline, closeOutline } from 'ionicons/icons';
import { DrillService, ImportDrillDto } from '@apex-team/client/data-access/drill';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-import-drill-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonTextarea,
    IonLabel,
    IonItem,
    IonIcon,
    IonSpinner,
    IonNote,
    IonText,
    IonList,
    IonChip,
  ],
  templateUrl: './import-drill-modal.html',
})
export class ImportDrillModal {
  private readonly modalCtrl = inject(ModalController);
  private readonly drillService = inject(DrillService);

  protected jsonPasted = signal('');
  protected parsedDrill = signal<ImportDrillDto | null>(null);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ cloudUploadOutline, documentOutline, checkmarkCircleOutline, alertCircleOutline, closeOutline });
  }

  protected handleFileUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      this.jsonPasted.set(content);
      this.parseJson(content);
    };
    reader.readAsText(file);
  }

  protected onTextChange(val: string): void {
    this.parseJson(val);
  }

  private parseJson(val: string): void {
    this.errorMessage.set(null);
    if (!val.trim()) {
      this.parsedDrill.set(null);
      return;
    }

    try {
      const parsed = JSON.parse(val);
      
      // Basic validation for preview
      if (!parsed.name) {
        throw new Error('Drill name is required.');
      }
      if (!parsed.instructions || !Array.isArray(parsed.instructions)) {
        throw new Error('Instructions must be an array.');
      }

      this.parsedDrill.set(parsed as ImportDrillDto);
    } catch (e: any) {
      this.errorMessage.set(e.message || 'Invalid JSON format.');
      this.parsedDrill.set(null);
    }
  }

  protected async saveImport(): Promise<void> {
    const drill = this.parsedDrill();
    if (!drill) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const saved = await firstValueFrom(this.drillService.importDrill(drill));
      void this.modalCtrl.dismiss(saved);
    } catch (e: any) {
      this.errorMessage.set('Failed to save imported drill. Check if the schema matches strictly.');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected dismiss(): void {
    void this.modalCtrl.dismiss();
  }
}
