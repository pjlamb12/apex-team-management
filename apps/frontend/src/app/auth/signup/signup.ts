import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonInput, IonButton, IonText,
} from '@ionic/angular/standalone';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonInput, IonButton, IonText,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  protected readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);

  protected form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected errorMessage = signal<string | null>(null);
  protected isLoading = signal(false);

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const { email, password, displayName } = this.form.getRawValue();
      await this.authService.signup(email!, password!, displayName!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      this.errorMessage.set(
        message.includes('409') || message.includes('already')
          ? 'An account with this email already exists.'
          : 'Signup failed. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
