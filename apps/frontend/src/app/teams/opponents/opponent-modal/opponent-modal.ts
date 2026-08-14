import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
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
  IonSpinner,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline } from 'ionicons/icons';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { OpponentsService } from '@apex-team/client/data-access/team';
import { Opponent, ThreatLevel } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-opponent-modal',
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
    IonSpinner,
    IonIcon,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './opponent-modal.html',
  styleUrl: './opponent-modal.scss',
})
export class OpponentModal implements OnInit {
  @Input() teamId!: string;
  @Input() opponent?: Opponent | null;

  private readonly modalCtrl = inject(ModalController);
  private readonly opponentsService = inject(OpponentsService);
  private readonly fb = inject(FormBuilder);

  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    threatLevel: ['medium' as ThreatLevel, [Validators.required]],
    formation: [''],
    primaryColor: [''],
    secondaryColor: [''],
    coachName: [''],
    contactInfo: [''],
    tendencies: [''],
    notes: [''],
  });

  constructor() {
    addIcons({ closeOutline, saveOutline });
  }

  ngOnInit(): void {
    if (this.opponent) {
      this.form.patchValue({
        name: this.opponent.name || '',
        threatLevel: this.opponent.threatLevel || 'medium',
        formation: this.opponent.formation || '',
        primaryColor: this.opponent.primaryColor || '',
        secondaryColor: this.opponent.secondaryColor || '',
        coachName: this.opponent.coachName || '',
        contactInfo: this.opponent.contactInfo || '',
        tendencies: this.opponent.tendencies || '',
        notes: this.opponent.notes || '',
      });
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const val = this.form.getRawValue();
      const payload: Partial<Opponent> = {
        name: val.name!,
        threatLevel: val.threatLevel as ThreatLevel,
        formation: val.formation || undefined,
        primaryColor: val.primaryColor || undefined,
        secondaryColor: val.secondaryColor || undefined,
        coachName: val.coachName || undefined,
        contactInfo: val.contactInfo || undefined,
        tendencies: val.tendencies || undefined,
        notes: val.notes || undefined,
      };

      let result: Opponent;
      if (this.opponent?.id) {
        result = await firstValueFrom(
          this.opponentsService.updateOpponent(this.teamId, this.opponent.id, payload),
        );
      } else {
        result = await firstValueFrom(
          this.opponentsService.createOpponent(this.teamId, payload),
        );
      }

      void this.modalCtrl.dismiss(result, 'saved');
    } catch {
      this.errorMessage.set('Failed to save opponent. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected dismiss(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }
}
