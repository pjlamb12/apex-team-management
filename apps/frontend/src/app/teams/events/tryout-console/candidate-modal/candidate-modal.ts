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
  IonTextarea,
  ModalController,
} from '@ionic/angular/standalone';
import { CandidateEntity, CandidateStatus } from '@apex-team/client/data-access/team';

@Component({
  selector: 'app-candidate-modal',
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
    IonTextarea,
  ],
  templateUrl: './candidate-modal.html',
})
export class CandidateModal implements OnInit {
  @Input() candidate?: CandidateEntity;

  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  protected form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    dateOfBirth: [''],
    parentName: [''],
    parentEmail: ['', [Validators.required, Validators.email]],
    parentPhone: [''],
    preferredPosition: [''],
    notes: [''],
    status: ['interested' as CandidateStatus, [Validators.required]],
  });

  ngOnInit(): void {
    if (this.candidate) {
      this.form.patchValue({
        firstName: this.candidate.firstName,
        lastName: this.candidate.lastName,
        dateOfBirth: this.candidate.dateOfBirth ?? '',
        parentName: this.candidate.parentName ?? '',
        parentEmail: this.candidate.parentEmail,
        parentPhone: this.candidate.parentPhone ?? '',
        preferredPosition: this.candidate.preferredPosition ?? '',
        notes: this.candidate.notes ?? '',
        status: this.candidate.status,
      });
    }
  }

  protected get title(): string {
    return this.candidate ? 'Edit Candidate' : 'Add Candidate';
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
