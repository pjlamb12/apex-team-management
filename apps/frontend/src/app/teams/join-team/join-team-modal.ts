import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonText,
  IonSpinner,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { TeamService } from '@apex-team/client/data-access/team';

@Component({
  selector: 'app-join-team-modal',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonInput,
    IonText,
    IonSpinner,
    IonIcon,
  ],
  templateUrl: './join-team-modal.html',
})
export class JoinTeamModal {
  private readonly modalCtrl = inject(ModalController);
  private readonly teamService = inject(TeamService);

  protected joinCode = signal('');
  protected isSubmitting = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected onCodeInput(event: any): void {
    const value = (event.target.value as string).toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.joinCode.set(value.substring(0, 6));
  }

  protected async dismiss(): Promise<void> {
    await this.modalCtrl.dismiss();
  }

  protected async submit(): Promise<void> {
    const code = this.joinCode();
    if (code.length !== 6) {
      this.errorMessage.set('Please enter a valid 6-character code.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.teamService.joinTeam(code);
      await this.modalCtrl.dismiss({ joined: true });
    } catch (error: any) {
      this.errorMessage.set(error.error?.message || 'Failed to join team. Please check your code.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
