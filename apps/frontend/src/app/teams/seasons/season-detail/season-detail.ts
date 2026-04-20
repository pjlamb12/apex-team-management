import { Component, inject, signal, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, calendarOutline } from 'ionicons/icons';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { SeasonsService } from '../seasons.service';
import { Season } from '@apex-team/shared/util/models';

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
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './season-detail.html',
  styleUrl: './season-detail.scss',
})
export class SeasonDetail {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }
  @Input() set seasonId(val: string) {
    this._seasonId.set(val);
  }

  private _teamId = signal<string | null>(null);
  private _seasonId = signal<string | null>(null);

  public get teamId(): string {
    return this._teamId() ?? '';
  }
  public get seasonId(): string {
    return this._seasonId() ?? '';
  }

  private readonly router = inject(Router);
  private readonly seasonsService = inject(SeasonsService);
  protected readonly fb = inject(FormBuilder);

  protected isEdit = signal(false);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    name: ['', [Validators.required]],
    startDate: [new Date().toISOString(), [Validators.required]],
    endDate: [new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), [Validators.required]],
    isActive: [false],
    defaultPracticeLocation: [''],
  });

  constructor() {
    addIcons({ saveOutline, calendarOutline });

    // Load season whenever seasonId changes
    effect(() => {
      const sId = this._seasonId();
      if (sId && sId !== 'new') {
        this.isEdit.set(true);
        void this.loadSeason(sId);
      } else {
        this.isEdit.set(false);
        this.form.reset({
          name: '',
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          isActive: false,
          defaultPracticeLocation: '',
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
      });
    } catch {
      this.errorMessage.set('Failed to load season. Please try again.');
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
