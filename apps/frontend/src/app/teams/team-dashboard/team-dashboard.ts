import { Component, inject, signal, effect, Input } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { firstValueFrom, filter } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonRouterOutlet,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  settingsOutline,
} from 'ionicons/icons';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
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
  selector: 'app-team-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonRouterOutlet,
    IonText,
  ],
  templateUrl: './team-dashboard.html',
  styleUrl: './team-dashboard.scss',
})
export class TeamDashboard {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }

  private _teamId = signal<string | null>(null);
  public get teamId(): string {
    return this._teamId() ?? '';
  }

  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly router = inject(Router);

  protected team = signal<Team | null>(null);
  protected selectedSegment = signal<'roster' | 'schedule' | 'drills'>('roster');
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  constructor() {
    addIcons({
      settingsOutline,
    });

    // Sync segment with current URL
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateSegmentFromUrl();
    });

    // Load team whenever teamId changes
    effect(() => {
      const id = this._teamId();
      if (id) {
        void this.loadTeam(id);
      }
    });

    this.updateSegmentFromUrl();
  }

  protected async loadTeam(teamId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const team = await firstValueFrom(this.http.get<Team>(`${this.apiUrl}/teams/${teamId}`));
      this.team.set(team);
    } catch {
      this.errorMessage.set('Failed to load team data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateSegmentFromUrl(): void {
    const url = this.router.url;
    if (url.includes('/schedule')) {
      this.selectedSegment.set('schedule');
    } else if (url.includes('/drills')) {
      this.selectedSegment.set('drills');
    } else {
      this.selectedSegment.set('roster');
    }
  }

  protected onSegmentChange(event: Event): void {
    const segment = (event as CustomEvent).detail.value as 'roster' | 'schedule' | 'drills';
    this.selectedSegment.set(segment);
    
    const teamId = this.teamId;
    if (segment === 'schedule') {
      void this.router.navigate(['/teams', teamId, 'schedule']);
    } else if (segment === 'drills') {
      void this.router.navigate(['/teams', teamId, 'drills']);
    } else {
      void this.router.navigate(['/teams', teamId, 'roster']);
    }
  }
}
