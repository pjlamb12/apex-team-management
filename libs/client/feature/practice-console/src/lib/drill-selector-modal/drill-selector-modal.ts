import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonSearchbar,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, searchOutline, checkmarkOutline } from 'ionicons/icons';
import { DrillService, Drill } from '@apex-team/client/data-access/drill';

@Component({
  selector: 'app-drill-selector-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonSearchbar,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
  ],
  templateUrl: './drill-selector-modal.html',
  styleUrl: './drill-selector-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillSelectorModal implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly drillService = inject(DrillService);

  protected readonly searchTerm = signal('');
  protected readonly selectedDrills = signal<Drill[]>([]);

  protected readonly drills = this.drillService.drills;

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
    addIcons({ closeOutline, searchOutline, checkmarkOutline });
  }

  ngOnInit() {
    this.drillService.getDrills().subscribe();
  }

  protected handleSearch(event: any): void {
    this.searchTerm.set(event.detail.value || '');
  }

  protected cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  protected confirm() {
    return this.modalCtrl.dismiss(this.selectedDrills(), 'confirm');
  }

  protected toggleSelection(drill: Drill) {
    const current = this.selectedDrills();
    const index = current.findIndex(d => d.id === drill.id);
    if (index > -1) {
      this.selectedDrills.set(current.filter(d => d.id !== drill.id));
    } else {
      this.selectedDrills.set([...current, drill]);
    }
  }

  protected isSelected(drill: Drill): boolean {
    return this.selectedDrills().some(d => d.id === drill.id);
  }
}
