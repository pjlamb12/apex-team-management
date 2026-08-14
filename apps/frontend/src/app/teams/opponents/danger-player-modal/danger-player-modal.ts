import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonChip,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, addOutline, closeCircleOutline } from 'ionicons/icons';
import { DangerPlayer, ThreatLevel } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-danger-player-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonChip,
  ],
  templateUrl: './danger-player-modal.html',
  styleUrl: './danger-player-modal.scss',
})
export class DangerPlayerModal implements OnInit {
  @Input() player?: DangerPlayer | null;

  private readonly modalCtrl = inject(ModalController);
  private readonly fb = inject(FormBuilder);

  protected currentTags = signal<string[]>([]);
  protected newTagInput = signal<string>('');

  protected quickPresetTags = [
    'Left-Footed',
    'Pacey / Fast',
    'Aerial Threat',
    'Playmaker',
    'Set Piece Specialist',
    'Aggressive Tackler',
    'Vulnerable Goalie',
    'High Press Trigger',
  ];

  protected form = this.fb.group({
    jerseyNumber: [null as number | null],
    name: ['', [Validators.required, Validators.minLength(2)]],
    position: [''],
    threatLevel: ['high' as ThreatLevel, [Validators.required]],
    notes: [''],
  });

  constructor() {
    addIcons({ closeOutline, saveOutline, addOutline, closeCircleOutline });
  }

  ngOnInit(): void {
    if (this.player) {
      this.form.patchValue({
        jerseyNumber: this.player.jerseyNumber ?? null,
        name: this.player.name || '',
        position: this.player.position || '',
        threatLevel: this.player.threatLevel || 'high',
        notes: this.player.notes || '',
      });
      if (this.player.tags) {
        this.currentTags.set([...this.player.tags]);
      }
    }
  }

  protected addTag(tag: string): void {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!this.currentTags().includes(trimmed)) {
      this.currentTags.update((tags) => [...tags, trimmed]);
    }
    this.newTagInput.set('');
  }

  protected removeTag(tagToRemove: string): void {
    this.currentTags.update((tags) => tags.filter((t) => t !== tagToRemove));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const result: DangerPlayer = {
      id: this.player?.id || '',
      jerseyNumber: val.jerseyNumber ? Number(val.jerseyNumber) : null,
      name: val.name!,
      position: val.position || undefined,
      threatLevel: val.threatLevel as ThreatLevel,
      notes: val.notes || undefined,
      tags: this.currentTags(),
    };

    void this.modalCtrl.dismiss(result, 'saved');
  }

  protected dismiss(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }
}
