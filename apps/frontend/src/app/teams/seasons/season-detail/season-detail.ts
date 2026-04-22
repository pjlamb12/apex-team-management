import { Component, inject, signal, effect, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, calendarOutline, barChartOutline } from 'ionicons/icons';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { SeasonsService } from '@apex-team/client/data-access/team';
import { Season, SeasonStats } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-season-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonToggle,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './season-detail.html',
  styleUrl: './season-detail.scss',
})
export class SeasonDetail {
  @Input() set seasonId(val: string) {
    this._seasonId.set(val);
  }
  public get seasonId(): string {
    return this._seasonId() ?? '';
  }

  @Input() set id(val: string) {
    this._teamId.set(val);
  }
  public get teamId(): string {
    return this._teamId() ?? '';
  }

  private _teamId = signal<string | null>(null);
  private _seasonId = signal<string | null>(null);

  private readonly router = inject(Router);
  private readonly seasonsService = inject(SeasonsService);
  protected readonly fb = inject(FormBuilder);

  protected isEdit = signal(false);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected stats = signal<SeasonStats | null>(null);
  protected isLoadingStats = signal(false);
  protected statsError = signal(false);

  protected statCards = computed(() => {
    const s = this.stats();
    if (!s) return [];
    
    return [
      { label: 'Wins', value: s.wins },
      { label: 'Losses', value: s.losses },
      { label: 'Draws', value: s.draws },
      { label: 'GF', value: s.goalsFor },
      { label: 'GA', value: s.goalsAgainst },
      { label: 'GD', value: s.goalDifference, color: s.goalDifference > 0 ? 'success' : s.goalDifference < 0 ? 'danger' : 'medium' },
    ];
  });

  protected form = this.fb.group({
    name: ['', [Validators.required]],
    startDate: [new Date().toISOString(), [Validators.required]],
    endDate: [new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), [Validators.required]],
    isActive: [false],
    defaultPracticeLocation: [''],
    defaultHomeVenue: [''],
    defaultHomeColor: [''],
    defaultAwayColor: [''],
    periodCount: [2, [Validators.required, Validators.min(1)]],
    periodLengthMinutes: [45, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    addIcons({ saveOutline, calendarOutline, barChartOutline });

    // Load season whenever seasonId changes
    effect(() => {
      const sId = this._seasonId();
      const tId = this._teamId();
      if (sId && sId !== 'new') {
        this.isEdit.set(true);
        void this.loadSeason(sId);
        if (tId) {
          void this.loadStats(tId, sId);
        }
      } else {
        this.isEdit.set(false);
        this.stats.set(null);
        this.form.reset({
          name: '',
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          isActive: false,
          defaultPracticeLocation: '',
          defaultHomeVenue: '',
          defaultHomeColor: '',
          defaultAwayColor: '',
          periodCount: 2,
          periodLengthMinutes: 45,
        });
      }
    });
  }

  protected async loadSeason(id: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const season = await firstValueFrom(this.seasonsService.findOne(id));
      this.form.patchValue({
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        isActive: season.isActive,
        defaultPracticeLocation: season.defaultPracticeLocation || '',
        defaultHomeVenue: season.defaultHomeVenue || '',
        defaultHomeColor: season.defaultHomeColor || '',
        defaultAwayColor: season.defaultAwayColor || '',
        periodCount: season.periodCount || 2,
        periodLengthMinutes: season.periodLengthMinutes || 45,
      });
    } catch {
      this.errorMessage.set('Failed to load season. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async loadStats(teamId: string, seasonId: string): Promise<void> {
    this.isLoadingStats.set(true);
    this.statsError.set(false);
    try {
      const data = await firstValueFrom(this.seasonsService.getSeasonStats(teamId, seasonId));
      this.stats.set(data);
    } catch {
      this.statsError.set(true);
    } finally {
      this.isLoadingStats.set(false);
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

    try {
      const data = this.form.getRawValue();
      const seasonId = this.seasonId;

      if (this.isEdit() && seasonId) {
        await firstValueFrom(this.seasonsService.update(seasonId, data as Partial<Season>));
      } else {
        await firstValueFrom(this.seasonsService.create(teamId, data as Partial<Season>));
      }

      await this.router.navigate(['/teams', teamId, 'settings', 'seasons']);
    } catch (error: any) {
      const msg = error?.error?.message || 'Failed to save season. Please try again.';
      this.errorMessage.set(msg);
    } finally {
      this.isSaving.set(false);
    }
  }
}
