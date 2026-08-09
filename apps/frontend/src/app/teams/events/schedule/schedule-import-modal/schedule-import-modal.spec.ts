import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ScheduleImportModal } from './schedule-import-modal';
import { EventsService } from '@apex-team/client/data-access/team';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { vi } from 'vitest';

describe('ScheduleImportModal', () => {
  let component: ScheduleImportModal;
  let fixture: ComponentFixture<ScheduleImportModal>;
  let eventsService: EventsService;
  let modalCtrl: ModalController;
  let toastCtrl: ToastController;

  const mockToast = {
    present: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const mockRuntimeConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    const mockModalController = {
      dismiss: vi.fn().mockResolvedValue(true),
    };

    const mockToastController = {
      create: vi.fn().mockResolvedValue(mockToast),
    };

    await TestBed.configureTestingModule({
      imports: [ScheduleImportModal],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
        { provide: ModalController, useValue: mockModalController },
        { provide: ToastController, useValue: mockToastController },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleImportModal);
    component = fixture.componentInstance;
    eventsService = TestBed.inject(EventsService);
    modalCtrl = TestBed.inject(ModalController);
    toastCtrl = TestBed.inject(ToastController);

    component.teamId = 'team-123';
    component.seasons = [
      { id: 's1', name: 'Spring 2026', isActive: true } as any,
    ];
    component.leagues = [
      { id: 'l1', seasonId: 's1', name: 'Spring League', defaultHomeVenue: 'Main Field', defaultHomeColor: 'Navy', defaultAwayColor: 'White' } as any,
    ];
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with active season and default league if provided', () => {
    component.defaultLeagueId = 'l1';
    fixture.detectChanges();

    expect(component['selectedSeasonId']()).toBe('s1');
    expect(component['selectedLeagueId']()).toBe('l1');
  });

  it('should load sample JSON when loadSample() is called', () => {
    fixture.detectChanges();
    component['loadSample']();

    expect(component['jsonInput']()).toContain('Strikers FC 2014');
    expect(component['parsedGames']().length).toBe(3);
    expect(component['parseError']()).toBeNull();
  });

  it('should strip markdown code fences and parse JSON', () => {
    fixture.detectChanges();
    const markdownWrapped = '```json\n[\n  {"opponent": "Lions FC", "scheduledAt": "2026-10-01T15:00:00", "isHomeGame": true}\n]\n```';
    component['jsonInput'].set(markdownWrapped);
    component['parseInput']();

    expect(component['parsedGames']().length).toBe(1);
    expect(component['parsedGames']()[0].opponent).toBe('Lions FC');
    expect(component['parseError']()).toBeNull();
  });

  it('should extract JSON from surrounding conversational text', () => {
    fixture.detectChanges();
    const conversational = 'Here is your schedule:\n[\n  {"opponent": "Wolves", "scheduledAt": "2026-10-05T12:00:00", "isHomeGame": false}\n]\nHope this helps!';
    component['jsonInput'].set(conversational);
    component['parseInput']();

    expect(component['parsedGames']().length).toBe(1);
    expect(component['parsedGames']()[0].opponent).toBe('Wolves');
    expect(component['parsedGames']()[0].isHomeGame).toBe(false);
  });

  it('should display error message on invalid JSON syntax', () => {
    fixture.detectChanges();
    component['jsonInput'].set('[{ invalid json');
    component['parseInput']();

    expect(component['parsedGames']().length).toBe(0);
    expect(component['parseError']()).toBeTruthy();
  });

  it('should allow removing a parsed game item', () => {
    fixture.detectChanges();
    component['loadSample']();
    const firstGameId = component['parsedGames']()[0].tempId;

    component['removeGame'](firstGameId);
    expect(component['parsedGames']().length).toBe(2);
    expect(component['parsedGames']().find(g => g.tempId === firstGameId)).toBeUndefined();
  });

  it('should allow toggling home/away on a parsed game item', () => {
    fixture.detectChanges();
    component['selectedLeagueId'].set('l1');
    component['loadSample']();
    const firstGame = component['parsedGames']()[0];
    expect(firstGame.isHomeGame).toBe(true);

    component['toggleHomeAway'](firstGame);
    expect(firstGame.isHomeGame).toBe(false);
    expect(firstGame.uniformColor).toBe('White');

    component['toggleHomeAway'](firstGame);
    expect(firstGame.isHomeGame).toBe(true);
    expect(firstGame.uniformColor).toBe('Navy');
  });

  it('should successfully call bulkCreateEvents and dismiss modal', async () => {
    fixture.detectChanges();
    component['selectedLeagueId'].set('l1');
    component['loadSample']();

    vi.spyOn(eventsService, 'bulkCreateEvents').mockReturnValue(of([{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }] as any));

    await component['importSchedule']();

    expect(eventsService.bulkCreateEvents).toHaveBeenCalledWith('team-123', expect.objectContaining({
      leagueId: 'l1',
      seasonId: 's1',
      events: expect.arrayContaining([
        expect.objectContaining({ opponent: 'Strikers FC 2014', type: 'game' })
      ]),
    }));

    expect(modalCtrl.dismiss).toHaveBeenCalledWith({ importedCount: 3 }, 'confirm');
  });
});
