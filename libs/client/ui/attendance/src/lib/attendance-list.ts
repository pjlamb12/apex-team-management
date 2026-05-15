import { Component, inject, signal, effect, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  bandageOutline,
  swapHorizontalOutline,
  peopleOutline
} from 'ionicons/icons';
import { AttendanceService, AttendanceRecord, PlayersService } from '@apex-team/client/data-access/team';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
  ],
  template: `
    <div class="flex items-center justify-between px-4 py-2 border-b border-ap-border bg-ap-surface">
      <div class="flex items-center gap-2 text-ap-muted">
        <ion-icon name="people-outline"></ion-icon>
        <span class="text-xs font-black uppercase tracking-widest">Attendance</span>
      </div>
      <div class="flex gap-2">
        @if (isGame()) {
          <ion-button fill="clear" size="small" (click)="syncFromLineup()" class="text-[10px] font-bold">
            <ion-icon slot="start" name="swap-horizontal-outline"></ion-icon>
            Sync Lineup
          </ion-button>
        }
        <ion-button fill="clear" size="small" (click)="markAllPresent()" class="text-[10px] font-bold">
          Mark All Present
        </ion-button>
      </div>
    </div>

    @if (isLoading()) {
      <div class="flex items-center justify-center py-12">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>
    } @else {
      <ion-list lines="full">
        @for (player of combinedList(); track player.id) {
          <ion-item>
            <ion-label>
              <div class="font-bold text-ap-text">
                {{ player.firstName }} {{ player.lastName }}
                <span class="text-ap-muted font-normal ml-1">#{{ player.jerseyNumber }}</span>
              </div>
            </ion-label>
            <ion-select [value]="player.status" aria-label="Status" (ionChange)="updateStatus(player.id, $event.detail.value)" interface="popover">
              <ion-select-option value="present">Present</ion-select-option>
              <ion-select-option value="absent">Absent</ion-select-option>
              <ion-select-option value="tardy">Tardy</ion-select-option>
              <ion-select-option value="injured">Injured</ion-select-option>
            </ion-select>
            <div slot="end" class="ml-4">
              @switch (player.status) {
                @case ('present') { <ion-icon name="checkmark-circle-outline" color="success"></ion-icon> }
                @case ('absent') { <ion-icon name="close-circle-outline" color="danger"></ion-icon> }
                @case ('tardy') { <ion-icon name="alert-circle-outline" color="warning"></ion-icon> }
                @case ('injured') { <ion-icon name="bandage-outline" color="medium"></ion-icon> }
              }
            </div>
          </ion-item>
        } @empty {
          <div class="py-12 text-center text-ap-muted italic">
            No players found for this team.
          </div>
        }
      </ion-list>
    }
  `,
})
export class AttendanceList {
  teamId = input.required<string>();
  eventId = input.required<string>();
  isGame = input<boolean>(false);
  
  attendanceChanged = output<void>();

  private readonly attendanceService = inject(AttendanceService);
  private readonly playersService = inject(PlayersService);

  protected players = signal<any[]>([]);
  protected attendance = signal<AttendanceRecord[]>([]);
  protected isLoading = signal(true);

  protected combinedList = computed(() => {
    const players = this.players();
    const attendance = this.attendance();
    
    return players.map(p => {
      const record = attendance.find(a => a.playerId === p.id);
      return {
        ...p,
        status: record?.status || 'absent',
      };
    });
  });

  constructor() {
    addIcons({ 
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      bandageOutline,
      swapHorizontalOutline,
      peopleOutline
    });

    effect(() => {
      const tId = this.teamId();
      const eId = this.eventId();
      if (tId && eId) {
        void this.loadData(tId, eId);
      }
    });
  }

  protected async loadData(teamId: string, eventId: string) {
    this.isLoading.set(true);
    try {
      const [players, attendance] = await Promise.all([
        firstValueFrom(this.playersService.getPlayers(teamId)),
        firstValueFrom(this.attendanceService.getAttendance(teamId, eventId))
      ]);
      this.players.set(players);
      this.attendance.set(attendance);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async updateStatus(playerId: string, status: string) {
    await firstValueFrom(this.attendanceService.updateAttendance(this.teamId(), this.eventId(), { playerId, status }));
    this.refreshAttendance();
  }

  protected async syncFromLineup() {
    await firstValueFrom(this.attendanceService.syncFromLineup(this.teamId(), this.eventId()));
    this.refreshAttendance();
  }

  protected async markAllPresent() {
    await firstValueFrom(this.attendanceService.batchUpdateAttendance(this.teamId(), this.eventId(), { status: 'present' }));
    this.refreshAttendance();
  }

  private async refreshAttendance() {
    const updated = await firstValueFrom(this.attendanceService.getAttendance(this.teamId(), this.eventId()));
    this.attendance.set(updated);
    this.attendanceChanged.emit();
  }
}
