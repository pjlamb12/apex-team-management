import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Drill } from '@apex-team/client/data-access/drill';

@Component({
  selector: 'app-drill-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonIcon,
  ],
  templateUrl: './drill-details-modal.html',
  styleUrl: './drill-details-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillDetailsModal {
  private readonly modalCtrl = inject(ModalController);

  @Input({ required: true }) drill!: Drill;

  constructor() {
    addIcons({ closeOutline });
  }

  protected close() {
    return this.modalCtrl.dismiss();
  }
}
