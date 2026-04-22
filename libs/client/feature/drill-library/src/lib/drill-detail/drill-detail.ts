import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonBadge,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonText,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { DrillService } from '@apex-team/client/data-access/drill';
import { VideoEmbed } from '@apex-team/client/ui/drill';
import { map, switchMap } from 'rxjs';

@Component({
  selector: 'app-drill-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonBadge,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonText,
    IonCard,
    IonCardContent,
    VideoEmbed,
  ],
  templateUrl: './drill-detail.html',
  styleUrl: './drill-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly drillService = inject(DrillService);

  protected readonly drill = toSignal(
    this.route.params.pipe(
      map((params) => params['id']),
      switchMap((id) => this.drillService.getDrillById(id))
    )
  );

  constructor() {
    addIcons({ createOutline, trashOutline });
  }

  protected handleDelete(): void {
    const drill = this.drill();
    if (!drill) return;

    if (confirm('Are you sure you want to delete this drill?')) {
      this.drillService.deleteDrill(drill.id).subscribe(() => {
        // Navigation will be handled by the route's parent or by redirecting
        window.history.back();
      });
    }
  }
}
