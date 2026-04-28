import { Component, inject, signal, effect, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBadge,
  IonLabel,
  IonList,
  IonListHeader,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, chevronForwardOutline, refreshOutline, trashOutline, copyOutline } from 'ionicons/icons';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { CommonModule } from '@angular/common';
import { TeamService } from '../../../../../libs/client/data-access/team/src/lib/team.service';

interface Sport {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  sport: Sport;
  role?: 'HEAD_COACH' | 'ASSISTANT';
  joinCode?: string;
}

@Component({
  selector: 'app-edit-team',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonBadge,
    IonLabel,
    IonList,
    IonListHeader,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './edit-team.html',
  styleUrl: './edit-team.scss',
})
export class EditTeam {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  protected get teamId(): string {
    return this._teamId() ?? '';
  }

  private readonly teamService = inject(TeamService);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  protected readonly fb = inject(FormBuilder);

  protected team = signal<Team | null>(null);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected successMessage = signal<string | null>(null);

  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  protected get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  constructor() {
    addIcons({
      calendarOutline,
      chevronForwardOutline,
      refreshOutline,
      trashOutline,
      copyOutline,
    });

    // Load team whenever id changes
    effect(() => {
      const teamId = this._teamId();
      if (teamId) {
        void this.loadTeam(teamId);
      }
    });
  }

  protected async loadTeam(id: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      // We still use direct http for specific team fetch since it's not in the basic TeamService yet
      // but let's check if TeamService has it. It doesn't.
      // Actually, let's add it to TeamService for consistency.
      const team = await this.teamService.getTeam(id);
      this.team.set(team);
      this.form.patchValue({
        name: team.name,
      });
    } catch {
      this.errorMessage.set('Failed to load team. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async regenerateCode(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Regenerate Join Code?',
      message: 'This will invalidate the current code. Anyone with the old code will no longer be able to join.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Regenerate',
          handler: async () => {
            try {
              const { joinCode } = await this.teamService.regenerateCode(this.teamId);
              this.team.update((t) => (t ? { ...t, joinCode } : null));
            } catch {
              this.errorMessage.set('Failed to regenerate code.');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  protected async deleteTeam(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Team?',
      message: 'This action is permanent and cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          cssClass: 'alert-button-delete',
          handler: async () => {
            this.isSaving.set(true);
            try {
              await this.teamService.deleteTeam(this.teamId);
              await this.router.navigate(['/teams']);
            } catch {
              this.errorMessage.set('Failed to delete team.');
            } finally {
              this.isSaving.set(false);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  protected async copyCode(): Promise<void> {
    const code = this.team()?.joinCode;
    if (code) {
      await navigator.clipboard.writeText(code);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const teamId = this.teamId;
    if (!teamId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      const { name } = this.form.getRawValue();

      await this.teamService.updateTeam(teamId, { name });
      await this.router.navigate(['/teams', teamId, 'roster']);
    } catch {
      this.errorMessage.set('Failed to update team. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
