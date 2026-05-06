import { Component, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonInput,
  IonNote,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, addOutline, closeOutline, saveOutline, businessOutline } from 'ionicons/icons';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { LocationService, LocationEntity, GeocodedLocation } from '@apex-team/client/data-access/team';

@Component({
  selector: 'app-location-modal',
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
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonSpinner,
    IonInput,
    IonNote,
    ControlErrorsDisplayComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Add Location</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="flex flex-col gap-4">
        <!-- Search Section -->
        <div *ngIf="!showManualForm()">
          <p class="text-xs font-bold uppercase tracking-wider text-ap-muted mb-2">Search for Address</p>
          <ion-searchbar 
            placeholder="Search city, park, or address..." 
            (ionInput)="onSearch($event)"
            [debounce]="500"
            autocomplete="off"
            spellcheck="false"
          ></ion-searchbar>
          
          <div *ngIf="isSearching()" class="flex justify-center py-4">
            <ion-spinner name="crescent"></ion-spinner>
          </div>

          <ion-list *ngIf="searchResults().length > 0" class="rounded-lg border border-white/10 overflow-hidden mt-2">
            <ion-item *ngFor="let res of searchResults()" button (click)="selectSearchResult(res)" detail="false">
              <ion-icon name="business-outline" slot="start" color="medium"></ion-icon>
              <ion-label>
                <h3>{{ res.name }}</h3>
                <p class="text-xs" *ngIf="res.address && res.address !== res.name">
                  {{ res.address }}
                </p>
                <p class="text-xs text-ap-muted">
                  {{ res.city }}{{ res.city && res.state ? ', ' : '' }}{{ res.state }}
                  {{ res.postcode ? '(' + res.postcode + ')' : '' }}
                </p>
              </ion-label>
              <ion-icon name="add-outline" slot="end" color="primary"></ion-icon>
            </ion-item>
          </ion-list>

          <div class="mt-8 text-center">
            <p class="text-xs text-ap-muted mb-4 italic">Can't find it?</p>
            <ion-button fill="outline" size="small" (click)="toggleManualForm()">
              <ion-icon name="add-outline" slot="start"></ion-icon>
              Enter Manually
            </ion-button>
          </div>
        </div>

        <!-- Manual Form Section -->
        <div *ngIf="showManualForm()" [formGroup]="manualForm">
          <div class="flex items-center justify-between mb-4">
            <p class="text-xs font-bold uppercase tracking-wider text-ap-muted">Manual Entry</p>
            <ion-button fill="clear" size="small" (click)="toggleManualForm()">
              <ion-icon name="search-outline" slot="start"></ion-icon>
              Back to Search
            </ion-button>
          </div>

          <ngx-control-errors-display>
            <ion-item>
              <ion-input label="Venue Name" labelPlacement="floating" formControlName="name" placeholder="e.g. Roy Park Field 1"></ion-input>
            </ion-item>
          </ngx-control-errors-display>

          <ngx-control-errors-display class="block mt-2">
            <ion-item>
              <ion-input label="Street Address" labelPlacement="floating" formControlName="address" placeholder="e.g. 123 Main St"></ion-input>
            </ion-item>
          </ngx-control-errors-display>

          <div class="flex gap-2 mt-2">
            <ngx-control-errors-display class="flex-1">
              <ion-item>
                <ion-input label="City" labelPlacement="floating" formControlName="city" placeholder="e.g. Roy"></ion-input>
              </ion-item>
            </ngx-control-errors-display>
            <ngx-control-errors-display style="width: 80px">
              <ion-item>
                <ion-input label="State" labelPlacement="floating" formControlName="state" placeholder="UT"></ion-input>
              </ion-item>
            </ngx-control-errors-display>
          </div>

          <ngx-control-errors-display class="block mt-2">
            <ion-item>
              <ion-input label="Zip Code" labelPlacement="floating" formControlName="zipCode" placeholder="84067"></ion-input>
            </ion-item>
          </ngx-control-errors-display>

          <ion-button (click)="submitManual()" expand="block" class="mt-6" [disabled]="isSaving()">
            <ion-icon [name]="isSaving() ? '' : 'save-outline'" slot="start" *ngIf="!isSaving()"></ion-icon>
            <ion-spinner name="crescent" slot="start" *ngIf="isSaving()"></ion-spinner>
            Save Location
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
})
export class LocationModal {
  @Input() teamId!: string;

  private readonly modalCtrl = inject(ModalController);
  private readonly locationService = inject(LocationService);
  private readonly fb = inject(FormBuilder);

  protected searchResults = signal<GeocodedLocation[]>([]);
  protected isSearching = signal(false);
  protected isSaving = signal(false);
  protected showManualForm = signal(false);

  protected manualForm = this.fb.group({
    name: ['', [Validators.required]],
    address: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    zipCode: [''],
  });

  constructor() {
    addIcons({
      searchOutline,
      addOutline,
      closeOutline,
      saveOutline,
      businessOutline,
    });
  }

  protected async onSearch(event: any): Promise<void> {
    const query = event.detail.value;
    if (!query || query.length < 3) {
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    try {
      const results = await firstValueFrom(this.locationService.search(this.teamId, query));
      this.searchResults.set(results);
    } finally {
      this.isSearching.set(false);
    }
  }

  protected async selectSearchResult(res: GeocodedLocation): Promise<void> {
    this.isSaving.set(true);
    try {
      const newLoc = await firstValueFrom(this.locationService.createLocation(this.teamId, res));
      void this.modalCtrl.dismiss(newLoc);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected toggleManualForm(): void {
    this.showManualForm.update(v => !v);
  }

  protected async submitManual(): Promise<void> {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const val = this.manualForm.getRawValue();
      const locationData: Partial<LocationEntity> = {
        name: val.name || undefined,
        address: val.address || undefined,
        city: val.city || undefined,
        state: val.state || undefined,
        zipCode: val.zipCode || undefined,
      };

      const newLoc = await firstValueFrom(this.locationService.createManual(this.teamId, locationData));
      void this.modalCtrl.dismiss(newLoc);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected dismiss(): void {
    void this.modalCtrl.dismiss();
  }
}
