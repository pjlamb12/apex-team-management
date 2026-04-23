import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonContent,
  IonList,
  IonItem,
} from '@ionic/angular/standalone';
import {
  PracticeDrillsService,
  PracticeDrill,
} from '@apex-team/client/data-access/drill';
import { EventsService, EventEntity } from '@apex-team/client/data-access/team';
import { toSignal } from '@angular/core/rxjs-interop';
import { PracticePlanTab } from '../practice-plan-tab/practice-plan-tab';

@Component({
  selector: 'app-practice-console-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonContent,
    IonList,
    IonItem,
    PracticePlanTab,
  ],
  templateUrl: './practice-console-wrapper.html',
  styleUrl: './practice-console-wrapper.scss',
})
export class PracticeConsoleWrapper implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventsService = inject(EventsService);
  private readonly practiceDrillsService = inject(PracticeDrillsService);

  protected teamId = this.route.snapshot.params['id'];
  protected eventId = this.route.snapshot.params['eventId'];

  protected selectedSegment = signal<'summary' | 'plan'>('summary');
  
  private _event = signal<EventEntity | null>(null);
  protected event = this._event.asReadonly();

  private _plan = signal<PracticeDrill[]>([]);
  protected plan = this._plan.asReadonly();

  ngOnInit() {
    this.loadData();
  }

  protected loadData() {
    this.eventsService.getEvent(this.teamId, this.eventId).subscribe((event) => {
      this._event.set(event);
    });

    this.practiceDrillsService.getPlan(this.teamId, this.eventId).subscribe((plan) => {
      this._plan.set(plan);
    });
  }

  protected onSegmentChange(event: any) {
    this.selectedSegment.set(event.detail.value);
  }
}
