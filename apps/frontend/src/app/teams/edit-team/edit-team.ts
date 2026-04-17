import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
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
  IonText,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBadge,
  IonLabel,
} from '@ionic/angular/standalone';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

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
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonBadge,
    IonLabel,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './edit-team.html',
  styleUrl: './edit-team.scss',
})
export class EditTeam implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.loadTeam(id);
    }
  }

  protected async loadTeam(id: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<Team>(`${this.apiUrl}/teams/${id}`)
      );
      this.team.set(data);
      this.form.patchValue({ name: data.name });
    } catch {
      this.errorMessage.set('Failed to load team. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      const { name } = this.form.getRawValue();
      await firstValueFrom(
        this.http.patch(`${this.apiUrl}/teams/${id}`, { name })
      );
      await this.router.navigate(['/teams']);
    } catch {
      this.errorMessage.set('Failed to update team. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
