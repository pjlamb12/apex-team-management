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
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonInput, IonButton, IonText,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  protected readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);

  protected form = this.fb.group({
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
      const { email, password } = this.form.getRawValue();
      await this.authService.login(email!, password!);
    } catch {
      this.errorMessage.set('Invalid email or password. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
