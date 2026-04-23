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
} from '@ionic/angular/standalone';
import { PlayerEntity } from '../players.service';

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
  ],
  templateUrl: './player-modal.html',
  styleUrl: './player-modal.scss',
})
export class PlayerModal implements OnInit {
  @Input() player?: PlayerEntity;

  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  protected form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    jerseyNumber: [null as number | null, [Validators.required, Validators.min(0), Validators.max(999)]],
    parentEmail: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    if (this.player) {
      this.form.patchValue({
        firstName: this.player.firstName,
        lastName: this.player.lastName,
        jerseyNumber: this.player.jerseyNumber,
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
        parentEmail: value.parentEmail ?? undefined,
      },
      'confirm'
    );
  }
}
