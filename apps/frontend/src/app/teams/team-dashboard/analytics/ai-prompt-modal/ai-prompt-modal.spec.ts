import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AiPromptModalComponent } from './ai-prompt-modal';
import {
  AnalyticsService,
  SeasonsService,
  LeaguesService,
  PlayersService,
} from '@apex-team/client/data-access/team';
import { ModalController, Platform } from '@ionic/angular/standalone';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

describe('AiPromptModalComponent', () => {
  let component: AiPromptModalComponent;
  let fixture: ComponentFixture<AiPromptModalComponent>;

  const mockAnalyticsService = {
    getLlmPrompt: vi.fn().mockReturnValue(
      of({
        prompt: '# Master Practice Plan\n## Team: Apex Raptors',
        title: 'Apex Raptors - Practice Plan Generator Prompt',
        template: 'practice-plan',
        metadata: {
          teamName: 'Apex Raptors',
          sport: 'Soccer',
          gameCount: 3,
          practiceCount: 2,
          playerCount: 12,
          generatedAt: new Date().toISOString(),
        },
      }),
    ),
    downloadLlmMarkdown: vi.fn().mockReturnValue(of(new Blob(['# Prompt Markdown']))),
  };

  const mockSeasonsService = {
    seasons: signal([{ id: 's1', name: 'Fall 2026', isActive: true }]),
  };

  const mockLeaguesService = {
    findAllForSeason: vi.fn().mockReturnValue(of([{ id: 'l1', name: 'State Cup Tournament' }])),
  };

  const mockPlayersService = {
    getPlayers: vi.fn().mockReturnValue(of([{ id: 'p1', firstName: 'Leo', lastName: 'Messi' }])),
    getPlayersForSeason: vi.fn().mockReturnValue(of([{ id: 'p1', firstName: 'Leo', lastName: 'Messi' }])),
  };

  const mockModalCtrl = {
    dismiss: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const mockRuntimeConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    await TestBed.configureTestingModule({
      imports: [AiPromptModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: SeasonsService, useValue: mockSeasonsService },
        { provide: LeaguesService, useValue: mockLeaguesService },
        { provide: PlayersService, useValue: mockPlayersService },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: Platform, useValue: { is: vi.fn().mockReturnValue(false) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiPromptModalComponent);
    component = fixture.componentInstance;
    component.teamId = 't1';
    fixture.detectChanges();
  });

  it('should initialize with templates and generate initial prompt', async () => {
    expect(component).toBeTruthy();
    expect((component as any).templates.length).toBe(7);
    expect((component as any).selectedTemplate()).toBe('practice-plan');

    await (component as any).generatePrompt();
    expect(mockAnalyticsService.getLlmPrompt).toHaveBeenCalled();
    expect((component as any).promptResult()?.prompt).toContain('# Master Practice Plan');
  });

  it('should calculate estimated token and word counts', async () => {
    await (component as any).generatePrompt();
    const stats = (component as any).promptStats();
    expect(stats.words).toBeGreaterThan(0);
    expect(stats.estimatedTokens).toBeGreaterThan(0);
  });

  it('should switch templates and regenerate prompt', async () => {
    (component as any).selectTemplate('game-strategy');
    expect((component as any).selectedTemplate()).toBe('game-strategy');
    expect(mockAnalyticsService.getLlmPrompt).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ template: 'game-strategy' }),
    );
  });

  it('should dismiss modal when dismiss() is called', () => {
    (component as any).dismiss();
    expect(mockModalCtrl.dismiss).toHaveBeenCalled();
  });
});
