import { Component, Input, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonLabel,
  IonToggle,
  IonList,
  ModalController,
} from '@ionic/angular/standalone';
import { Season } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-season-modal',
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
    IonInput,
    IonLabel,
    IonToggle,
    IonList,
  ],
  templateUrl: './season-modal.html',
})
export class SeasonModal implements OnInit {
  @Input() season?: Season;

  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    startDate: [''],
    endDate: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.season) {
      this.form.patchValue({
        name: this.season.name,
        startDate: this.season.startDate ?? '',
        endDate: this.season.endDate ?? '',
        isActive: this.season.isActive,
      });
    }
  }

  protected get title(): string {
    return this.season ? 'Edit Season' : 'Add New Season';
  }

  protected async dismiss(): Promise<void> {
    await this.modalCtrl.dismiss(null, 'cancel');
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    await this.modalCtrl.dismiss(value, 'confirm');
  }
}
