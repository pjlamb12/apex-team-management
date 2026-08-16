import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { closeOutline, saveOutline, pricetagOutline } from 'ionicons/icons';
import {
  TacticPlay,
  CreateTacticPlayDto,
  TacticSport,
  TacticCategory,
  PitchType,
  TacticCanvasData,
} from '@apex-team/shared/util/models';

@Component({
  selector: 'app-save-play-modal',
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
    IonIcon,
  ],
  templateUrl: './save-play-modal.html',
  styleUrl: './save-play-modal.scss',
})
export class SavePlayModal implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() existingPlay?: TacticPlay;
  @Input({ required: true }) sport: TacticSport = 'soccer';
  @Input({ required: true }) pitchType: PitchType = 'full_pitch';
  @Input({ required: true }) canvasData!: TacticCanvasData;

  title = '';
  description = '';
  category: TacticCategory = 'formation';
  tagsInput = '';
  notes = '';

  constructor() {
    addIcons({ closeOutline, saveOutline, pricetagOutline });
  }

  ngOnInit(): void {
    if (this.existingPlay) {
      this.title = this.existingPlay.title;
      this.description = this.existingPlay.description || '';
      this.sport = this.existingPlay.sport;
      this.category = this.existingPlay.category;
      this.pitchType = this.existingPlay.pitchType;
      this.tagsInput = (this.existingPlay.tags || []).join(', ');
      this.notes = this.existingPlay.notes || '';
    } else {
      this.title = this.sport === 'soccer' ? '4-3-3 Formation' : '5-1 System';
    }
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    if (!this.title.trim()) return;

    const tags = this.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const dto: CreateTacticPlayDto = {
      title: this.title.trim(),
      description: this.description.trim() || undefined,
      sport: this.sport,
      category: this.category,
      pitchType: this.pitchType,
      tags,
      canvasData: this.canvasData,
      notes: this.notes.trim() || undefined,
    };

    this.modalCtrl.dismiss(dto, 'confirm');
  }
}
