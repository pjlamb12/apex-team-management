import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TacticBoard } from './tactic-board';
import { TacticsService } from '@apex-team/client/data-access/tactics';
import { ModalController, AlertController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('TacticBoard', () => {
  let component: TacticBoard;
  let fixture: ComponentFixture<TacticBoard>;
  let mockTacticsService: any;
  let mockModalCtrl: any;
  let mockAlertCtrl: any;

  beforeEach(async () => {
    mockTacticsService = {
      selectedSport: signal('soccer'),
      selectedCategory: signal('all'),
      searchQuery: signal(''),
      activePlay: signal(null),
      isLoading: signal(false),
      plays: signal([]),
      filteredPlays: signal([]),
      setSport: vi.fn((s) => mockTacticsService.selectedSport.set(s)),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn(),
      loadPlays: vi.fn().mockReturnValue(of([])),
      createPlay: vi.fn().mockReturnValue(of({ id: 'p1', title: 'Play 1' })),
      updatePlay: vi.fn().mockReturnValue(of({ id: 'p1', title: 'Play 1' })),
      deletePlay: vi.fn().mockReturnValue(of(null)),
      seedPresets: vi.fn().mockReturnValue(of([])),
      setActivePlay: vi.fn(),
    };

    mockModalCtrl = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn().mockResolvedValue(true),
        onWillDismiss: vi.fn().mockResolvedValue({ role: 'cancel' }),
      }),
    };

    mockAlertCtrl = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn().mockResolvedValue(true),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [TacticBoard],
      providers: [
        { provide: TacticsService, useValue: mockTacticsService },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: AlertController, useValue: mockAlertCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TacticBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the tactic board component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to soccer sport and board view', () => {
    expect(component.currentSport()).toBe('soccer');
    expect(component.viewMode()).toBe('board');
  });

  it('should switch sport to volleyball when requested', () => {
    component.onSportChange('volleyball');
    expect(mockTacticsService.setSport).toHaveBeenCalledWith('volleyball');
    expect(component.pitchType()).toBe('full_court');
  });

  it('should add player tokens and update history', () => {
    const initialCount = component.tokens().length;
    component.addPlayerToken('home');
    expect(component.tokens().length).toBe(initialCount + 1);
  });

  it('should add ball token', () => {
    component.tokens.set([]);
    component.addBallToken();
    expect(component.tokens().some((t) => t.team === 'ball')).toBe(true);
  });

  it('should manage multi-phase timeline', () => {
    expect(component.phases().length).toBe(1);
    component.addPhase();
    expect(component.phases().length).toBe(2);
    expect(component.currentPhaseIndex()).toBe(1);
  });
});
