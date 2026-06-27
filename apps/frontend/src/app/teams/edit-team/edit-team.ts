import { Component, inject, signal, effect, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
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
  IonToast,
  AlertController,
  ModalController,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendarOutline, 
  chevronForwardOutline, 
  refreshOutline, 
  trashOutline, 
  copyOutline, 
  shareOutline, 
  addOutline,
  starOutline
} from 'ionicons/icons';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { CommonModule } from '@angular/common';
import { TeamService, ScoutingService, ScoutingRubricEntity } from '@apex-team/client/data-access/team';

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
  calendarSecret?: string;
  homeLocationId?: string;
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
    IonToast,
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
  private readonly scoutingService = inject(ScoutingService);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  private readonly modalCtrl = inject(ModalController);
  protected readonly fb = inject(FormBuilder);

  protected team = signal<Team | null>(null);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected successMessage = signal<string | null>(null);
  protected toastMessage = signal<string | null>(null);

  protected rubrics = signal<ScoutingRubricEntity[]>([]);

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
      shareOutline,
      addOutline,
      starOutline,
    });

    // Load team whenever id changes
    effect(() => {
      const teamId = this._teamId();
      if (teamId) {
        void this.loadTeam(teamId);
        void this.loadRubrics();
      }
    });
  }

  protected async loadTeam(id: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
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

  protected async loadRubrics(): Promise<void> {
    const teamId = this.teamId;
    if (!teamId) return;
    try {
      const rubrics = await firstValueFrom(this.scoutingService.getRubrics(teamId));
      this.rubrics.set(rubrics);
    } catch {
      console.error('Failed to load rubrics');
    }
  }

  protected async addRubric(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Add Scouting Rubric',
      message: 'Enter a name for the evaluation category (e.g. Technical Skills)',
      inputs: [{ name: 'name', type: 'text', placeholder: 'Rubric Name' }],
      buttons: [
        'Cancel',
        {
          text: 'Add',
          handler: async (data) => {
            if (!data.name) return;
            try {
              const rubric = await firstValueFrom(this.scoutingService.addRubric(this.teamId, { name: data.name }));
              this.rubrics.update(list => [...list, rubric]);
              this.toastMessage.set('Rubric added');
            } catch {
              this.errorMessage.set('Failed to add rubric');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  protected async deleteRubric(id: string): Promise<void> {
    try {
      await firstValueFrom(this.scoutingService.deleteRubric(this.teamId, id));
      this.rubrics.update(list => list.filter(r => r.id !== id));
      this.toastMessage.set('Rubric removed');
    } catch {
      this.errorMessage.set('Failed to delete rubric');
    }
  }

  protected async regenerateCode(): Promise<void> {
    const teamId = this._teamId();
    if (!teamId) return;

    const alert = await this.alertCtrl.create({
      header: 'Regenerate Join Code?',
      message: 'This will invalidate the current code. Anyone with the old code will no longer be able to join.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Regenerate',
          handler: async () => {
            try {
              const { joinCode } = await this.teamService.regenerateCode(teamId);
              this.team.update((t) => (t ? { ...t, joinCode } : null));
              this.toastMessage.set('Join code regenerated');
            } catch {
              this.errorMessage.set('Failed to regenerate code.');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  protected async regenerateCalendarSecret(): Promise<void> {
    const teamId = this._teamId();
    if (!teamId) return;

    const alert = await this.alertCtrl.create({
      header: 'Regenerate Calendar Link?',
      message: 'This will invalidate your existing calendar subscriptions on other devices.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Regenerate',
          handler: async () => {
            try {
              const updatedTeam = await this.teamService.regenerateCalendarSecret(teamId);
              this.team.set(updatedTeam);
              this.toastMessage.set('Calendar link regenerated');
            } catch {
              this.errorMessage.set('Failed to regenerate calendar link.');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  protected async deleteTeam(): Promise<void> {
    const teamId = this._teamId();
    if (!teamId) return;

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
              await this.teamService.deleteTeam(teamId);
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
      this.toastMessage.set('Join code copied to clipboard');
    }
  }

  protected async copyCalendarUrl(): Promise<void> {
    const secret = this.team()?.calendarSecret;
    if (secret) {
      const url = `${this.apiUrl}/teams/calendar/${secret}.ics`;
      await navigator.clipboard.writeText(url);
      this.toastMessage.set('Calendar URL copied to clipboard');
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const teamId = this._teamId();
    if (!teamId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      const { name } = this.form.getRawValue();
      if (!name) return;

      await this.teamService.updateTeam(teamId, { 
        name, 
      });
      await this.router.navigate(['/teams', teamId, 'roster']);
    } catch {
      this.errorMessage.set('Failed to update team. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
