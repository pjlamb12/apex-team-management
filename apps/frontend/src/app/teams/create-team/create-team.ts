import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
  IonSelect,
  IonSelectOption,
  IonButton,
  IonText,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

interface Sport {
  id: string;
  name: string;
  isEnabled: boolean;
}

@Component({
  selector: 'app-create-team',
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
    IonSelect,
    IonSelectOption,
    IonButton,
    IonText,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonHeader,
    IonToolbar,
    IonTitle,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './create-team.html',
  styleUrl: './create-team.scss',
})
export class CreateTeam implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly router = inject(Router);
  protected readonly fb = inject(FormBuilder);

  protected sports = signal<Sport[]>([]);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    sportId: ['', [Validators.required]],
  });

  protected get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  ngOnInit(): void {
    void this.loadSports();
  }

  protected async loadSports(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<Sport[]>(`${this.apiUrl}/sports`)
      );
      this.sports.set(data);
      // Pre-select first sport (Soccer) per D-05
      if (data.length > 0) {
        this.form.patchValue({ sportId: data[0].id });
      }
    } catch {
      this.errorMessage.set('Failed to load sports. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const { name, sportId } = this.form.getRawValue();
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/teams`, { name, sportId })
      );
      await this.router.navigate(['/teams']);
    } catch {
      this.errorMessage.set('Failed to create team. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
