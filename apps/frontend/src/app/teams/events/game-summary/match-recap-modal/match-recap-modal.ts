import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonSpinner,
  IonToast,
  IonBadge,
  IonToggle,
  IonTextarea,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  ModalController,
  Platform,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  copyOutline,
  shareOutline,
  sparklesOutline,
  checkmarkOutline,
  refreshOutline,
  mailOutline,
  chatbubblesOutline,
  phonePortraitOutline,
  cameraOutline,
  starOutline,
  trendingUpOutline,
  analyticsOutline,
  createOutline,
  eyeOutline,
  calendarOutline,
  timeOutline,
  locationOutline,
  shirtOutline,
  documentTextOutline,
  chevronDownOutline,
  chevronForwardOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import {
  EventsService,
} from '@apex-team/client/data-access/team';
import {
  MatchRecapTone,
  MatchRecapFormat,
  MatchRecapResponse,
} from '@apex-team/shared/util/models';
import { Share } from '@capacitor/share';

export interface ToneOption {
  id: MatchRecapTone;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export interface FormatOption {
  id: MatchRecapFormat;
  label: string;
  shortLabel: string;
  icon: string;
  channel: string;
}

@Component({
  selector: 'app-match-recap-modal',
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
    IonFooter,
    IonIcon,
    IonSpinner,
    IonToast,
    IonBadge,
    IonToggle,
    IonTextarea,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
  ],
  templateUrl: './match-recap-modal.html',
  styleUrl: './match-recap-modal.scss',
})
export class MatchRecapModalComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly platform = inject(Platform);
  private readonly eventsService = inject(EventsService);

  @Input({ required: true }) teamId!: string;
  @Input({ required: true }) eventId!: string;
  @Input() initialTone: MatchRecapTone = 'youth_encouraging';
  @Input() initialFormat: MatchRecapFormat = 'email';

  protected readonly toneOptions: ToneOption[] = [
    {
      id: 'youth_encouraging',
      label: 'Youth & Encouraging',
      shortLabel: 'Encouraging',
      icon: 'star-outline',
      description: 'Positive, high-energy tone highlighting hustle, teamwork, sportsmanship, and growth.',
    },
    {
      id: 'developmental',
      label: 'Developmental Growth',
      shortLabel: 'Developmental',
      icon: 'trending-up-outline',
      description: 'Focuses on executing training themes, passing out of the back, scanning, and decision making.',
    },
    {
      id: 'tactical_competitive',
      label: 'Tactical & Competitive',
      shortLabel: 'Tactical',
      icon: 'analytics-outline',
      description: 'Objective match summary analyzing tactical adjustments, momentum swings, and competitive execution.',
    },
  ];

  protected readonly formatOptions: FormatOption[] = [
    {
      id: 'email',
      label: 'Parent Email / Newsletter',
      shortLabel: 'Parent Email',
      icon: 'mail-outline',
      channel: 'Email & Newsletters',
    },
    {
      id: 'chat',
      label: 'Team Chat / WhatsApp / GroupMe',
      shortLabel: 'Team Chat',
      icon: 'chatbubbles-outline',
      channel: 'Messaging Apps',
    },
    {
      id: 'sms',
      label: 'SMS / Text Alert',
      shortLabel: 'Quick SMS',
      icon: 'phone-portrait-outline',
      channel: 'Short SMS Alerts',
    },
    {
      id: 'social',
      label: 'Social Media Caption',
      shortLabel: 'Social Post',
      icon: 'camera-outline',
      channel: 'Instagram / Facebook',
    },
  ];

  protected readonly selectedTone = signal<MatchRecapTone>('youth_encouraging');
  protected readonly selectedFormat = signal<MatchRecapFormat>('email');
  protected readonly customCoachNotes = signal<string>('');
  protected readonly includeNextEvent = signal<boolean>(true);
  protected readonly includePlayerShoutouts = signal<boolean>(true);

  protected readonly recapResult = signal<MatchRecapResponse | null>(null);
  protected readonly editedRecapText = signal<string>('');
  protected readonly isEditing = signal<boolean>(false);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly isCopied = signal<boolean>(false);
  protected readonly isToastOpen = signal<boolean>(false);
  protected readonly toastMessage = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPromptInspector = signal<boolean>(false);

  constructor() {
    addIcons({
      closeOutline,
      copyOutline,
      shareOutline,
      sparklesOutline,
      checkmarkOutline,
      refreshOutline,
      mailOutline,
      chatbubblesOutline,
      phonePortraitOutline,
      cameraOutline,
      starOutline,
      trendingUpOutline,
      analyticsOutline,
      createOutline,
      eyeOutline,
      calendarOutline,
      timeOutline,
      locationOutline,
      shirtOutline,
      documentTextOutline,
      chevronDownOutline,
      chevronForwardOutline,
      alertCircleOutline,
    });
  }

  ngOnInit(): void {
    if (this.initialTone) this.selectedTone.set(this.initialTone);
    if (this.initialFormat) this.selectedFormat.set(this.initialFormat);
  }

  protected setTone(tone: MatchRecapTone): void {
    this.selectedTone.set(tone);
  }

  protected setFormat(format: MatchRecapFormat): void {
    this.selectedFormat.set(format);
  }

  protected onToggleNextEvent(event: CustomEvent): void {
    this.includeNextEvent.set(!!event.detail.checked);
  }

  protected onTogglePlayerShoutouts(event: CustomEvent): void {
    this.includePlayerShoutouts.set(!!event.detail.checked);
  }

  protected onCustomNotesChange(value: string): void {
    this.customCoachNotes.set(value || '');
  }

  protected async generateRecap(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const res = await firstValueFrom(
        this.eventsService.generateMatchRecap(this.teamId, this.eventId, {
          tone: this.selectedTone(),
          format: this.selectedFormat(),
          customCoachNotes: this.customCoachNotes() || undefined,
          includeNextEvent: this.includeNextEvent(),
          includePlayerShoutouts: this.includePlayerShoutouts(),
        }),
      );
      this.recapResult.set(res);
      this.editedRecapText.set(res.recap);
      this.isEditing.set(false);
    } catch (err: unknown) {
      console.error('Failed to generate match recap', err);
      const errorObj = err as { error?: { message?: string }; message?: string };
      const detail = errorObj?.error?.message || errorObj?.message || 'Unknown error occurred';
      this.errorMessage.set(`Could not generate recap: ${detail}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected toggleEdit(): void {
    this.isEditing.set(!this.isEditing());
  }

  protected async copyRecap(): Promise<void> {
    const text = this.editedRecapText() || this.recapResult()?.recap;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      this.isCopied.set(true);
      this.showToast('Copied recap to clipboard! Ready to paste into Email or Chat.');
      setTimeout(() => this.isCopied.set(false), 3000);
    } catch (e) {
      console.error('Clipboard copy failed', e);
      this.showToast('Could not copy automatically. Please select text manually.');
    }
  }

  protected async copyPrompt(): Promise<void> {
    const prompt = this.recapResult()?.prompt;
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt);
      this.showToast('Copied raw prompt to clipboard! Ready to paste into Gemini or ChatGPT.');
    } catch (e) {
      console.error('Clipboard copy failed', e);
      this.showToast('Could not copy prompt.');
    }
  }

  protected async shareRecap(): Promise<void> {
    const text = this.editedRecapText() || this.recapResult()?.recap;
    if (!text) return;

    const title = this.recapResult()?.title || 'Match Recap';

    if (this.platform.is('capacitor')) {
      try {
        await Share.share({
          title,
          text,
          dialogTitle: 'Share Match Recap',
        });
      } catch (err) {
        console.error('Capacitor Share failed', err);
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
        });
      } catch (err) {
        console.error('Web Share failed', err);
      }
    } else {
      await this.copyRecap();
    }
  }

  protected showToast(msg: string): void {
    this.toastMessage.set(msg);
    this.isToastOpen.set(true);
  }

  protected closeToast(): void {
    this.isToastOpen.set(false);
  }

  protected togglePromptInspector(): void {
    this.showPromptInspector.set(!this.showPromptInspector());
  }

  protected dismiss(): void {
    void this.modalCtrl.dismiss();
  }
}
