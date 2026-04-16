import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonInput, IonButton, IonText,
} from '@ionic/angular/standalone';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonInput, IonButton, IonText,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  protected readonly fb = inject(FormBuilder);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly http = inject(HttpClient);

  // Which flow is active — determined from ?token query param
  protected resetToken = signal<string | null>(null);

  protected forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected successMessage = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected isLoading = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.resetToken.set(token);
  }

  protected async submitForgot(): Promise<void> {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const { email } = this.forgotForm.getRawValue();
      await firstValueFrom(
        this.http.post('/api/auth/forgot-password', { email })
      );
      this.successMessage.set(
        'If that email exists, a reset link has been sent. Check the server console in development.'
      );
    } catch {
      this.errorMessage.set('Something went wrong. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async submitReset(): Promise<void> {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const { newPassword } = this.resetForm.getRawValue();
      await firstValueFrom(
        this.http.post('/api/auth/reset-password', {
          token: this.resetToken(),
          newPassword,
        })
      );
      await this.router.navigate(['/login']);
    } catch {
      this.errorMessage.set('Invalid or expired reset link. Please request a new one.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
