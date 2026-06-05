import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonButton,
  ModalController,
  IonItem,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, searchOutline, filterOutline, cloudUploadOutline } from 'ionicons/icons';
import { DrillService } from '@apex-team/client/data-access/drill';
import { ThemeToggle } from '@apex-team/client/ui/theme-toggle';
import { ImportDrillModal } from '../import-drill-modal/import-drill-modal';

@Component({
  selector: 'app-drill-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonChip,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonButtons,
    IonButton,
    ThemeToggle,
    IonItem,
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './drill-list.html',
  styleUrl: './drill-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillList {
  protected readonly drillService = inject(DrillService);
  private readonly modalCtrl = inject(ModalController);

  protected readonly searchTerm = signal('');
  protected readonly selectedTags = signal<string[]>([]);

  protected readonly drills = this.drillService.drills;
  protected readonly allTags = this.drillService.tags;

  protected readonly filteredDrills = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const drills = this.drills();

    if (!term) return drills;

    return drills.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term) ||
        d.tags.some((t) => t.name.toLowerCase().includes(term))
    );
  });

  constructor() {
    addIcons({ addOutline, searchOutline, filterOutline, cloudUploadOutline });

    // Initial data fetch
    this.drillService.getTags().subscribe();

    // Effect to refetch drills when selected tags change
    effect(() => {
      this.drillService.getDrills(this.selectedTags()).subscribe();
    });
  }

  protected handleSearch(event: any): void {
    this.searchTerm.set(event.detail.value || '');
  }

  protected onTagsChange(event: any): void {
    this.selectedTags.set(event.detail.value || []);
  }

  protected async openImportModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ImportDrillModal,
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      // Reload is handled by tap() in service
    }
  }
}
