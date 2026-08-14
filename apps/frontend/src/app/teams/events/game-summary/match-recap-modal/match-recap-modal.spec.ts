import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchRecapModalComponent } from './match-recap-modal';
import { EventsService } from '@apex-team/client/data-access/team';
import { ModalController, Platform } from '@ionic/angular/standalone';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { MatchRecapResponse } from '@apex-team/shared/util/models';

describe('MatchRecapModalComponent', () => {
  let component: MatchRecapModalComponent;
  let fixture: ComponentFixture<MatchRecapModalComponent>;

  const mockRecapResponse: MatchRecapResponse = {
    recap: 'Subject: Match Recap: Apex Strikers vs Storm FC (3-1)\n\nGreat match today!',
    title: 'Apex Strikers vs Storm FC - Match Recap',
    tone: 'youth_encouraging',
    format: 'email',
    prompt: 'MATCH DATA: Team: Apex Strikers...',
    isAiGenerated: true,
    model: 'gemini-3.6-flash',
    nextEvent: {
      id: 'next-1',
      type: 'game',
      opponent: 'Thunder SC',
      scheduledAt: '2026-08-22T14:00:00.000Z',
      location: 'Field 4',
      uniformColor: 'Navy',
      arrivalMinutesBefore: 30,
    },
    generatedAt: new Date().toISOString(),
  };

  const mockEventsService = {
    generateMatchRecap: vi.fn().mockReturnValue(of(mockRecapResponse)),
    getMatchRecapPrompt: vi.fn().mockReturnValue(of({ prompt: 'PROMPT DATA', systemInstruction: 'INSTRUCTION' })),
  };

  const mockModalCtrl = {
    dismiss: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const mockRuntimeConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    await TestBed.configureTestingModule({
      imports: [MatchRecapModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EventsService, useValue: mockEventsService },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
        {
          provide: Platform,
          useValue: {
            is: vi.fn().mockReturnValue(false),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchRecapModalComponent);
    component = fixture.componentInstance;
    component.teamId = 'team-123';
    component.eventId = 'event-456';
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should NOT automatically generate recap on init to avoid wasting API calls', () => {
    expect(mockEventsService.generateMatchRecap).not.toHaveBeenCalled();
  });

  it('should update tone and format selections without triggering API calls before clicking generate', () => {
    (component as any).setTone('developmental');
    (component as any).setFormat('chat');
    expect((component as any).selectedTone()).toBe('developmental');
    expect((component as any).selectedFormat()).toBe('chat');
    expect(mockEventsService.generateMatchRecap).not.toHaveBeenCalled();
  });

  it('should generate recap when generateRecap is called with selected parameters', async () => {
    (component as any).setTone('tactical_competitive');
    (component as any).setFormat('sms');
    (component as any).customCoachNotes.set('Great effort today');

    await (component as any).generateRecap();

    expect(mockEventsService.generateMatchRecap).toHaveBeenCalledWith('team-123', 'event-456', expect.objectContaining({
      tone: 'tactical_competitive',
      format: 'sms',
      customCoachNotes: 'Great effort today',
      includeNextEvent: true,
      includePlayerShoutouts: true,
    }));
  });

  it('should dismiss modal when dismiss is called', () => {
    (component as any).dismiss();
    expect(mockModalCtrl.dismiss).toHaveBeenCalled();
  });
});
