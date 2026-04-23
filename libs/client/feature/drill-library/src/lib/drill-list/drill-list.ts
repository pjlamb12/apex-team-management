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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, searchOutline, filterOutline } from 'ionicons/icons';
import { DrillService } from '@apex-team/client/data-access/drill';

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
  ],
  templateUrl: './drill-list.html',
  styleUrl: './drill-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillList {
  protected readonly drillService = inject(DrillService);

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
    addIcons({ addOutline, searchOutline, filterOutline });

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

  protected toggleTag(tagName: string): void {
    const current = this.selectedTags();
    if (current.includes(tagName)) {
      this.selectedTags.set(current.filter((t) => t !== tagName));
    } else {
      this.selectedTags.set([...current, tagName]);
    }
  }

  protected isTagSelected(tagName: string): boolean {
    return this.selectedTags().includes(tagName);
  }
}
