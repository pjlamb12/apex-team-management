import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonList,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { LocationService, LocationEntity, TeamService } from '@apex-team/client/data-access/team';
import { LocationModal } from '@apex-team/client/ui/location-modal';
import { League, LeagueType } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-league-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonInput,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonList,
    IonIcon,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './league-modal.html',
})
export class LeagueModal implements OnInit {
  @Input() league?: League;
  @Input() teamId!: string;

  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);
  private readonly locationService = inject(LocationService);
  private readonly teamService = inject(TeamService);

  protected locations = signal<LocationEntity[]>([]);
  protected team = signal<any | null>(null);

  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['league' as LeagueType, [Validators.required]],
    isActive: [true],
    playersOnField: [11, [Validators.required, Validators.min(1)]],
    periodCount: [2, [Validators.required, Validators.min(1)]],
    periodLengthMinutes: [45, [Validators.required, Validators.min(1)]],
    defaultHomeVenue: [''],
    defaultHomeColor: [''],
    defaultAwayColor: [''],
    homeLocationId: [''],
    bestOfSets: [5, [Validators.required, Validators.min(1)]],
    setScoreGoal: [25, [Validators.required, Validators.min(1)]],
    winByTwo: [true],
    pointCap: [null as number | null, [Validators.min(1)]],
    decidingSetScoreGoal: [15, [Validators.required, Validators.min(1)]],
    decidingSetPointCap: [null as number | null, [Validators.min(1)]],
  });

  constructor() {
    addIcons({ addOutline });
  }

  ngOnInit(): void {
    if (this.league) {
      this.form.patchValue({
        name: this.league.name,
        type: this.league.type,
        isActive: this.league.isActive,
        playersOnField: this.league.playersOnField || 11,
        periodCount: this.league.periodCount || 2,
        periodLengthMinutes: this.league.periodLengthMinutes || 45,
        defaultHomeVenue: this.league.defaultHomeVenue || '',
        defaultHomeColor: this.league.defaultHomeColor || '',
        defaultAwayColor: this.league.defaultAwayColor || '',
        homeLocationId: this.league.homeLocationId || '',
        bestOfSets: this.league.bestOfSets ?? 5,
        setScoreGoal: this.league.setScoreGoal ?? 25,
        winByTwo: this.league.winByTwo ?? true,
        pointCap: this.league.pointCap ?? null,
        decidingSetScoreGoal: this.league.decidingSetScoreGoal ?? 15,
        decidingSetPointCap: this.league.decidingSetPointCap ?? null,
      });
    }
    if (this.teamId) {
      void this.loadLocations(this.teamId);
      void this.loadTeam(this.teamId);
    }
  }

  protected async loadTeam(teamId: string): Promise<void> {
    try {
      const teamDetails = await this.teamService.getTeam(teamId);
      this.team.set(teamDetails);
    } catch (e) {
      console.error('Failed to load team details', e);
    }
  }

  protected async loadLocations(teamId: string): Promise<void> {
    try {
      const locs = await firstValueFrom(this.locationService.getLocations(teamId));
      this.locations.set(locs);
    } catch {
      console.error('Failed to load locations');
    }
  }

  protected async presentLocationModal(): Promise<void> {
    const teamId = this.teamId;
    if (!teamId) return;

    const modal = await this.modalCtrl.create({
      component: LocationModal,
      componentProps: { teamId }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      const newLoc = data as LocationEntity;
      this.locations.update((prev) => [...prev, newLoc]);
      this.form.patchValue({ homeLocationId: newLoc.id });
    }
  }

  protected get title(): string {
    return this.league ? 'Edit Competition' : 'Add Competition';
  }

  protected async dismiss(): Promise<void> {
    await this.modalCtrl.dismiss(null, 'cancel');
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const rawValue = this.form.getRawValue();
    const value = {
      ...rawValue,
      homeLocationId: rawValue.homeLocationId || null,
    };
    await this.modalCtrl.dismiss(value, 'confirm');
  }
}
