import { Component, inject, signal, effect, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, chevronForwardOutline } from 'ionicons/icons';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { Season } from '@apex-team/shared/util/models';
import { CommonModule } from '@angular/common';

interface Sport {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  sport: Sport;
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

  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly router = inject(Router);
  protected readonly fb = inject(FormBuilder);

  protected team = signal<Team | null>(null);
  protected activeSeason = signal<Season | null>(null);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected successMessage = signal<string | null>(null);

  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    defaultHomeVenue: [''],
    defaultHomeColor: [''],
    defaultAwayColor: [''],
  });

  protected get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  constructor() {
    addIcons({ calendarOutline, chevronForwardOutline });

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
      const [team, season] = await Promise.all([
        firstValueFrom(this.http.get<Team>(`${this.apiUrl}/teams/${id}`)),
        firstValueFrom(
          this.http.get<Season>(`${this.apiUrl}/teams/${id}/seasons/active`)
        ),
      ]);
      this.team.set(team);
      this.activeSeason.set(season);
      this.form.patchValue({
        name: team.name,
        defaultHomeVenue: season.defaultHomeVenue ?? '',
        defaultHomeColor: season.defaultHomeColor ?? '',
        defaultAwayColor: season.defaultAwayColor ?? '',
      });
    } catch {
      this.errorMessage.set('Failed to load team and season. Please try again.');
    } finally {
      this.isLoading.set(false);
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
      const { name, defaultHomeVenue, defaultHomeColor, defaultAwayColor } =
        this.form.getRawValue();

      const season = this.activeSeason();
      if (!season) {
        throw new Error('No active season found');
      }

      await Promise.all([
        firstValueFrom(this.http.patch(`${this.apiUrl}/teams/${teamId}`, { name })),
        firstValueFrom(
          this.http.patch(`${this.apiUrl}/seasons/${season.id}`, {
            defaultHomeVenue,
            defaultHomeColor,
            defaultAwayColor,
          })
        ),
      ]);
      await this.router.navigate(['/teams', teamId, 'roster']);
    } catch {
      this.errorMessage.set('Failed to update settings. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
