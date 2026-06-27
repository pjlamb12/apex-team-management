import { Component, input, effect, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonTextarea,
  IonButton,
  IonIcon,
  IonBadge,
  IonSpinner,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trashOutline,
  pencilOutline,
  checkmarkOutline,
  closeOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { EventsService, EventNote, TeamService } from '@apex-team/client/data-access/team';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-coaching-notes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonTextarea,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner,
  ],
  templateUrl: './coaching-notes.html',
})
export class CoachingNotes implements OnInit {
  teamId = input.required<string>();
  eventId = input.required<string>();

  private readonly eventsService = inject(EventsService);
  private readonly teamService = inject(TeamService);
  private readonly alertCtrl = inject(AlertController);

  protected notes = signal<EventNote[]>([]);
  protected isLoading = signal<boolean>(true);
  protected newNoteContent = signal<string>('');
  protected isSubmitting = signal<boolean>(false);

  // Editing state
  protected editingNoteId = signal<string | null>(null);
  protected editingContent = signal<string>('');

  // Roles to determine delete/edit permissions
  protected isHeadCoach = signal<boolean>(false);
  protected currentUserId = signal<string | null>(null);

  constructor() {
    addIcons({
      trashOutline,
      pencilOutline,
      checkmarkOutline,
      closeOutline,
      documentTextOutline,
    });

    // Reload notes when eventId changes
    effect(() => {
      const eId = this.eventId();
      const tId = this.teamId();
      if (eId && tId) {
        this.loadNotes();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const userId = this.getUserIdFromToken();
    if (userId) {
      this.currentUserId.set(userId);
    }

    try {
      const team = await this.teamService.getTeam(this.teamId());
      if (team && userId) {
        this.isHeadCoach.set(team.coachId === userId);
      }
    } catch (e) {
      console.error('Error fetching team context in coaching notes', e);
    }
  }

  private getUserIdFromToken(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;
    } catch {
      return null;
    }
  }

  protected async loadNotes(): Promise<void> {
    this.isLoading.set(true);
    try {
      const notesList = await firstValueFrom(
        this.eventsService.getEventNotes(this.teamId(), this.eventId())
      );
      this.notes.set(notesList);
    } catch (e) {
      console.error('Failed to load notes', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async addNote(): Promise<void> {
    const content = this.newNoteContent().trim();
    if (!content || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      const newNote = await firstValueFrom(
        this.eventsService.createEventNote(this.teamId(), this.eventId(), content)
      );
      this.notes.update((current) => [...current, newNote]);
      this.newNoteContent.set('');
    } catch (e) {
      console.error('Failed to add note', e);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected startEdit(note: EventNote): void {
    this.editingNoteId.set(note.id);
    this.editingContent.set(note.content);
  }

  protected cancelEdit(): void {
    this.editingNoteId.set(null);
    this.editingContent.set('');
  }

  protected async saveEdit(noteId: string): Promise<void> {
    const content = this.editingContent().trim();
    if (!content) return;

    try {
      const updated = await firstValueFrom(
        this.eventsService.updateEventNote(this.teamId(), this.eventId(), noteId, content)
      );
      this.notes.update((current) =>
        current.map((n) => (n.id === noteId ? updated : n))
      );
      this.cancelEdit();
    } catch (e) {
      console.error('Failed to update note', e);
    }
  }

  protected async confirmDelete(noteId: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      cssClass: 'ap-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          cssClass: 'alert-button-delete',
          handler: () => {
            this.deleteNote(noteId);
          },
        },
      ],
    });
    await alert.present();
  }

  private async deleteNote(noteId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.eventsService.deleteEventNote(this.teamId(), this.eventId(), noteId)
      );
      this.notes.update((current) => current.filter((n) => n.id !== noteId));
    } catch (e) {
      console.error('Failed to delete note', e);
    }
  }

  protected canDelete(note: EventNote): boolean {
    return note.userId === this.currentUserId() || this.isHeadCoach();
  }

  protected canEdit(note: EventNote): boolean {
    return note.userId === this.currentUserId();
  }
}
