import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  printOutline,
  trophyOutline,
  sparklesOutline,
  checkmarkCircleOutline,
  ribbonOutline,
} from 'ionicons/icons';
import {
  PlayerGoal,
  PlayerAward,
} from '@apex-team/shared/util/models';
import { PlayerProfileAnalytics } from '@apex-team/client/data-access/team';

@Component({
  selector: 'app-idp-growth-card-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
  ],
  templateUrl: './idp-growth-card-modal.html',
  styleUrl: './idp-growth-card-modal.scss',
})
export class IdpGrowthCardModalComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input({ required: true }) teamName!: string;
  @Input({ required: true }) profile!: PlayerProfileAnalytics;
  @Input({ required: true }) goals!: PlayerGoal[];
  @Input({ required: true }) awards!: PlayerAward[];
  @Input() seasonName?: string;

  protected currentDate = new Date();

  constructor() {
    addIcons({
      closeOutline,
      printOutline,
      trophyOutline,
      sparklesOutline,
      checkmarkCircleOutline,
      ribbonOutline,
    });
  }

  ngOnInit(): void {
    // Component ready
  }

  protected printCard(): void {
    window.print();
  }

  protected getMasteryPercent(stage: string): number {
    switch (stage) {
      case 'emerging': return 33;
      case 'developing': return 66;
      case 'mastered': return 100;
      default: return 33;
    }
  }

  protected dismiss(): void {
    void this.modalCtrl.dismiss();
  }
}
