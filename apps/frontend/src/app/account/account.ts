import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonToast,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  lockClosedOutline,
  logOutOutline,
  trashOutline,
  checkmarkCircleOutline,
  mailOutline,
  calendarOutline,
  personOutline,
  keyOutline,
} from 'ionicons/icons';
import { ThemeToggle } from '@apex-team/client/ui/theme-toggle';
import { AuthService, UserProfile } from '../auth/auth.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonToast,
    ThemeToggle,
  ],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class AccountSettings implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly alertCtrl = inject(AlertController);

  protected profile = signal<UserProfile | null>(null);
  protected isLoading = signal(false);
  protected isSavingProfile = signal(false);
  protected isChangingPassword = signal(false);
  protected isDeleting = signal(false);

  protected profileMessage = signal<string | null>(null);
  protected profileError = signal<string | null>(null);
  protected passwordMessage = signal<string | null>(null);
  protected passwordError = signal<string | null>(null);
  protected toastMessage = signal<string | null>(null);

  protected profileForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
  });

  protected passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor() {
    addIcons({
      personCircleOutline,
      lockClosedOutline,
      logOutOutline,
      trashOutline,
      checkmarkCircleOutline,
      mailOutline,
      calendarOutline,
      personOutline,
      keyOutline,
    });
  }

  ngOnInit(): void {
    void this.loadProfile();
  }

  protected async loadProfile(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.authService.getProfile();
      this.profile.set(data);
      this.profileForm.patchValue({ displayName: data.displayName });
    } catch {
      // If profile fetch fails, fall back to currentUser signal
      const user = this.authService.currentUser();
      if (user) {
        this.profile.set({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          createdAt: '',
        });
        this.profileForm.patchValue({ displayName: user.displayName });
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const displayName = this.profileForm.value.displayName?.trim();
    if (!displayName) return;

    this.isSavingProfile.set(true);
    this.profileMessage.set(null);
    this.profileError.set(null);

    try {
      const updated = await this.authService.updateProfile(displayName);
      this.profile.update((p) => (p ? { ...p, displayName: updated.displayName } : null));
      this.profileMessage.set('Profile updated successfully.');
      this.toastMessage.set('Profile updated');
    } catch {
      this.profileError.set('Failed to update profile. Please try again.');
    } finally {
      this.isSavingProfile.set(false);
    }
  }

  protected async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      this.passwordError.set('New passwords do not match.');
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordMessage.set(null);
    this.passwordError.set(null);

    try {
      await this.authService.changePassword(currentPassword, newPassword);
      this.passwordMessage.set('Password changed successfully.');
      this.toastMessage.set('Password updated');
      this.passwordForm.reset();
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        this.passwordError.set('Current password is incorrect.');
      } else {
        this.passwordError.set('Failed to change password. Please try again.');
      }
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected async confirmDeleteAccount(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Account?',
      subHeader: 'Permanent and Irreversible',
      message:
        'This action permanently deletes your account and all associated teams, rosters, events, and player statistics. You cannot undo this action.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete Everything',
          role: 'destructive',
          cssClass: 'text-danger',
          handler: () => {
            void this.deleteAccount();
          },
        },
      ],
    });
    await alert.present();
  }

  private async deleteAccount(): Promise<void> {
    this.isDeleting.set(true);
    try {
      await this.authService.deleteAccount();
    } catch {
      this.toastMessage.set('Failed to delete account. Please try again.');
      this.isDeleting.set(false);
    }
  }
}
