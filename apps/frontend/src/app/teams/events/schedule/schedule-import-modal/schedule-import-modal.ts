import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonIcon,
  IonBadge,
  IonSpinner,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  copyOutline,
  checkmarkOutline,
  sparklesOutline,
  cloudUploadOutline,
  trashOutline,
  calendarOutline,
  locationOutline,
  informationCircleOutline,
  chevronDownOutline,
  chevronUpOutline,
  timeOutline,
  colorPaletteOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { EventsService, CreateEventDto } from '@apex-team/client/data-access/team';
import { Season, League } from '@apex-team/shared/util/models';

export interface EditableImportGame {
  tempId: string;
  opponent: string;
  scheduledAt: string;
  isHomeGame: boolean;
  location?: string;
  uniformColor?: string;
  notes?: string;
}

@Component({
  selector: 'app-schedule-import-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonIcon,
    IonBadge,
    IonSpinner,
  ],
  templateUrl: './schedule-import-modal.html',
  styleUrl: './schedule-import-modal.scss',
})
export class ScheduleImportModal implements OnInit {
  @Input() teamId!: string;
  @Input() defaultSeasonId?: string;
  @Input() defaultLeagueId?: string | null;
  @Input() seasons: Season[] = [];
  @Input() leagues: League[] = [];

  private readonly eventsService = inject(EventsService);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastCtrl = inject(ToastController);

  protected selectedSeasonId = signal<string>('');
  protected selectedLeagueId = signal<string | null>(null);
  protected jsonInput = signal<string>('');
  protected parsedGames = signal<EditableImportGame[]>([]);
  protected parseError = signal<string | null>(null);
  protected isImporting = signal<boolean>(false);
  protected copiedPrompt = signal<boolean>(false);
  protected showPromptGuide = signal<boolean>(true);

  protected selectedLeague = computed(() => {
    const id = this.selectedLeagueId();
    if (!id) return null;
    return this.leagues.find((l) => l.id === id) ?? null;
  });

  readonly geminiPromptTemplate = `Extract the game schedule from this image into a clean JSON array of game objects with this exact schema:

[
  {
    "opponent": "Opponent Team Name",
    "scheduledAt": "2026-09-15T18:30:00",
    "isHomeGame": true,
    "location": "Field / Complex Name (e.g., Regional Park - Field 4)",
    "uniformColor": "Navy",
    "notes": "Any tournament round, check-in instructions, or game notes"
  }
]

Formatting Rules:
1. Return ONLY the valid JSON array without any markdown code fences, comments, or extra conversational text.
2. "scheduledAt" must be a 24-hour ISO 8601 string (YYYY-MM-DDTHH:mm:ss) in the local game time.
3. If year is missing in the image, use current year (2026).
4. "isHomeGame" must be boolean (true for Home, false for Away/Visitor). Default to true if not specified.
5. Clean up opponent names (strip division tags or redundant bracket codes).`;

  readonly sampleJson = `[
  {
    "opponent": "Strikers FC 2014",
    "scheduledAt": "2026-09-12T09:00:00",
    "isHomeGame": true,
    "location": "Sunset Sports Complex - Field 3",
    "uniformColor": "Navy",
    "notes": "Tournament Group Stage - Game 1"
  },
  {
    "opponent": "Thunder SC Blue",
    "scheduledAt": "2026-09-12T14:30:00",
    "isHomeGame": false,
    "location": "Sunset Sports Complex - Field 3",
    "uniformColor": "White",
    "notes": "Tournament Group Stage - Game 2"
  },
  {
    "opponent": "Apex United",
    "scheduledAt": "2026-09-13T10:15:00",
    "isHomeGame": true,
    "location": "Sunset Sports Complex - Stadium Field",
    "uniformColor": "Navy",
    "notes": "Semifinal Round"
  }
]`;

  constructor() {
    addIcons({
      copyOutline,
      checkmarkOutline,
      sparklesOutline,
      cloudUploadOutline,
      trashOutline,
      calendarOutline,
      locationOutline,
      informationCircleOutline,
      chevronDownOutline,
      chevronUpOutline,
      timeOutline,
      colorPaletteOutline,
      documentTextOutline,
    });
  }

  ngOnInit(): void {
    if (this.defaultSeasonId) {
      this.selectedSeasonId.set(this.defaultSeasonId);
    } else if (this.seasons.length > 0) {
      const active = this.seasons.find((s) => s.isActive) || this.seasons[0];
      this.selectedSeasonId.set(active.id);
    }

    if (this.defaultLeagueId !== undefined) {
      this.selectedLeagueId.set(this.defaultLeagueId);
    }
  }

  protected togglePromptGuide(): void {
    this.showPromptGuide.update((v) => !v);
  }

  protected async copyPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.geminiPromptTemplate);
      this.copiedPrompt.set(true);
      setTimeout(() => this.copiedPrompt.set(false), 2500);
      const toast = await this.toastCtrl.create({
        message: 'Prompt copied to clipboard! Paste it into Gemini with your screenshot.',
        duration: 3000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();
    } catch {
      this.copiedPrompt.set(true);
      setTimeout(() => this.copiedPrompt.set(false), 2500);
    }
  }

  protected loadSample(): void {
    this.jsonInput.set(this.sampleJson);
    this.parseInput();
  }

  protected onJsonChange(event: any): void {
    const val = event.detail?.value ?? '';
    this.jsonInput.set(val);
    if (val.trim()) {
      this.parseInput();
    } else {
      this.parsedGames.set([]);
      this.parseError.set(null);
    }
  }

  protected parseInput(): void {
    let raw = this.jsonInput().trim();
    if (!raw) {
      this.parsedGames.set([]);
      this.parseError.set(null);
      return;
    }

    // Strip markdown code fences if Gemini returned ```json ... ```
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    // If surrounding text is present, extract array or object containing games
    const firstBracket = raw.indexOf('[');
    const lastBracket = raw.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      raw = raw.substring(firstBracket, lastBracket + 1);
    }

    try {
      const parsed = JSON.parse(raw);
      let items: any[] = [];

      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && Array.isArray(parsed.games)) {
        items = parsed.games;
      } else if (parsed && Array.isArray(parsed.schedule)) {
        items = parsed.schedule;
      } else {
        throw new Error('Expected a JSON array of game objects.');
      }

      if (items.length === 0) {
        throw new Error('JSON array is empty. No games found.');
      }

      const defaultHomeVenue = this.selectedLeague()?.defaultHomeVenue;
      const defaultHomeColor = this.selectedLeague()?.defaultHomeColor;
      const defaultAwayColor = this.selectedLeague()?.defaultAwayColor;

      const validatedGames: EditableImportGame[] = items.map((item, idx) => {
        let isHome = true;
        if (typeof item.isHomeGame === 'boolean') {
          isHome = item.isHomeGame;
        } else if (typeof item.home === 'boolean') {
          isHome = item.home;
        } else if (typeof item.type === 'string') {
          isHome = !item.type.toLowerCase().includes('away');
        }

        let scheduledAt = item.scheduledAt || item.date || item.dateTime || '';
        if (scheduledAt) {
          // Normalize format if space separated: "2026-09-15 18:30" -> "2026-09-15T18:30:00"
          if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/.test(scheduledAt)) {
            scheduledAt = scheduledAt.replace(' ', 'T');
          }
          // Ensure ISO string is valid
          const dateObj = new Date(scheduledAt);
          if (!isNaN(dateObj.getTime())) {
            // Keep local datetime string YYYY-MM-DDTHH:mm
            scheduledAt = scheduledAt.substring(0, 16);
          }
        }

        return {
          tempId: `game_${Date.now()}_${idx}`,
          opponent: item.opponent || item.opponentName || item.team || `Opponent ${idx + 1}`,
          scheduledAt: scheduledAt || new Date().toISOString().substring(0, 16),
          isHomeGame: isHome,
          location: item.location || item.venue || item.field || (isHome ? defaultHomeVenue : '') || '',
          uniformColor: item.uniformColor || item.jersey || (isHome ? defaultHomeColor : defaultAwayColor) || '',
          notes: item.notes || item.round || item.details || '',
        };
      });

      this.parsedGames.set(validatedGames);
      this.parseError.set(null);
    } catch (err: any) {
      this.parsedGames.set([]);
      this.parseError.set(err.message || 'Invalid JSON format. Please check the structure.');
    }
  }

  protected removeGame(tempId: string): void {
    this.parsedGames.update((list) => list.filter((g) => g.tempId !== tempId));
  }

  protected toggleHomeAway(game: EditableImportGame): void {
    game.isHomeGame = !game.isHomeGame;
    // Optionally update default uniform color based on home/away toggle if not customized
    const league = this.selectedLeague();
    if (league) {
      if (game.isHomeGame && league.defaultHomeColor) {
        game.uniformColor = league.defaultHomeColor;
      } else if (!game.isHomeGame && league.defaultAwayColor) {
        game.uniformColor = league.defaultAwayColor;
      }
    }
  }

  protected async dismiss(): Promise<void> {
    await this.modalCtrl.dismiss(null, 'cancel');
  }

  protected async importSchedule(): Promise<void> {
    const games = this.parsedGames();
    if (games.length === 0) return;

    this.isImporting.set(true);
    try {
      const dtos: CreateEventDto[] = games.map((g) => ({
        type: 'game',
        opponent: g.opponent.trim(),
        scheduledAt: new Date(g.scheduledAt).toISOString(),
        isHomeGame: g.isHomeGame,
        location: g.location?.trim() || undefined,
        uniformColor: g.uniformColor?.trim() || undefined,
        notes: g.notes?.trim() || undefined,
        leagueId: this.selectedLeagueId() ?? undefined,
      }));

      await firstValueFrom(
        this.eventsService.bulkCreateEvents(this.teamId, {
          events: dtos,
          leagueId: this.selectedLeagueId() ?? undefined,
          seasonId: this.selectedSeasonId() || undefined,
        })
      );

      const toast = await this.toastCtrl.create({
        message: `Successfully imported ${games.length} game${games.length === 1 ? '' : 's'}!`,
        duration: 3000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();

      await this.modalCtrl.dismiss({ importedCount: games.length }, 'confirm');
    } catch (err: any) {
      console.error('Failed to import schedule', err);
      const toast = await this.toastCtrl.create({
        message: err?.error?.message || 'Failed to import games. Please try again.',
        duration: 4000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.isImporting.set(false);
    }
  }
}
