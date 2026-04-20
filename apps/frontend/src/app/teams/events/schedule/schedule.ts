import { Component, inject, signal, OnInit, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonNote,
  IonSpinner,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSegment,
  IonSegmentButton,
  AlertController,
  IonRouterLink,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  fitnessOutline,
  locationOutline,
  trashOutline,
  chevronForwardOutline,
  pencilOutline,
} from 'ionicons/icons';
import { EventsService, EventEntity } from '../events.service';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonNote,
    IonSpinner,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonSegment,
    IonSegmentButton,
    IonRouterLink,
  ],
  templateUrl: './schedule.html',
})
export class Schedule implements OnInit {
  @Input({ required: true }) teamId!: string;

  private readonly eventsService = inject(EventsService);
  private readonly alertCtrl = inject(AlertController);

  protected events = signal<EventEntity[]>([]);
  protected isLoading = signal(false);
  protected scope = signal<'upcoming' | 'past'>('upcoming');

  constructor() {
    addIcons({
      calendarOutline,
      fitnessOutline,
      locationOutline,
      trashOutline,
      chevronForwardOutline,
      pencilOutline,
    });
  }

  ngOnInit(): void {
    void this.loadEvents();
  }

  protected async onScopeChange(event: any): Promise<void> {
    const value = event.detail.value as 'upcoming' | 'past';
    this.scope.set(value);
    await this.loadEvents();
  }

  protected async loadEvents(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.eventsService.getEvents(this.teamId, this.scope())
      );
      this.events.set(data);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async deleteEvent(event: EventEntity): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Event?',
      message: `Are you sure you want to delete this ${event.type}?`,
      buttons: [
        'Cancel',
        {
          text: 'Delete',
          role: 'confirm',
          handler: async () => {
            try {
              await firstValueFrom(this.eventsService.deleteEvent(this.teamId, event.id));
              this.events.update((list) => list.filter((e) => e.id !== event.id));
            } catch {
              console.error('Failed to delete event');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  protected getEventTitle(event: EventEntity): string {
    if (event.type === 'practice') return 'Practice';
    return `vs ${event.opponent}`;
  }

  protected getEventIcon(event: EventEntity): string {
    return event.type === 'game' ? 'calendar-outline' : 'fitness-outline';
  }
}
