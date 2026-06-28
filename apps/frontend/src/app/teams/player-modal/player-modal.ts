import { Component, Input, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { PlayerEntity } from '@apex-team/client/data-access/team';

@Component({
  selector: 'app-player-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './player-modal.html',
  styleUrl: './player-modal.scss',
})
export class PlayerModal implements OnInit {
  @Input() player?: PlayerEntity;
  @Input() positions: string[] = [];

  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  protected form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    jerseyNumber: [null as number | null, [Validators.required, Validators.min(0), Validators.max(999)]],
    preferredPosition: [''],
    parentEmail: ['', [Validators.email]],
  });

  ngOnInit(): void {
    if (this.player) {
      this.form.patchValue({
        firstName: this.player.firstName,
        lastName: this.player.lastName,
        jerseyNumber: this.player.jerseyNumber,
        preferredPosition: this.player.preferredPosition ?? '',
        parentEmail: this.player.parentEmail ?? '',
      });
    }
  }

  protected get title(): string {
    return this.player ? 'Edit Player' : 'Add Player';
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
    await this.modalCtrl.dismiss(
      {
        firstName: value.firstName!,
        lastName: value.lastName!,
        jerseyNumber: value.jerseyNumber ?? undefined,
        preferredPosition: value.preferredPosition || undefined,
        parentEmail: value.parentEmail || undefined,
      },
      'confirm'
    );
  }
}
