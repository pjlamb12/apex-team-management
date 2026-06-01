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
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonList,
  ModalController,
} from '@ionic/angular/standalone';
import { League, LeagueType } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-league-modal',
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
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonList,
  ],
  templateUrl: './league-modal.html',
})
export class LeagueModal implements OnInit {
  @Input() league?: League;

  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['league' as LeagueType, [Validators.required]],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.league) {
      this.form.patchValue({
        name: this.league.name,
        type: this.league.type,
        isActive: this.league.isActive,
      });
    }
  }

  protected get title(): string {
    return this.league ? 'Edit Competition' : 'Add Competition';
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
