import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdpNoteModalComponent } from './idp-note-modal';
import { GoalsService, EventsService } from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('IdpNoteModalComponent', () => {
  let component: IdpNoteModalComponent;
  let fixture: ComponentFixture<IdpNoteModalComponent>;

  const mockGoalsService = {
    addGoalNote: vi.fn().mockReturnValue(of({ id: 'note-1', note: 'Great scan' })),
  };

  const mockEventsService = {
    getEvents: vi.fn().mockReturnValue(of([
      { id: 'ev-1', type: 'game', opponent: 'Tornadoes', scheduledAt: '2026-05-01T10:00:00Z' },
    ])),
  };

  const mockModalCtrl = {
    dismiss: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdpNoteModalComponent],
      providers: [
        { provide: GoalsService, useValue: mockGoalsService },
        { provide: EventsService, useValue: mockEventsService },
        { provide: ModalController, useValue: mockModalCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IdpNoteModalComponent);
    component = fixture.componentInstance;
    component.teamId = 'team-123';
    component.goal = {
      id: 'g1',
      teamId: 'team-123',
      playerId: 'p1',
      title: 'Scan before receiving',
      category: 'tactical',
      status: 'in_progress',
      masteryStage: 'developing',
      timeframe: 'full_season',
      createdAt: '2026-04-01',
      updatedAt: '2026-04-01',
    };
    fixture.detectChanges();
  });

  it('should create the component and load recent events', () => {
    expect(component).toBeTruthy();
    expect(mockEventsService.getEvents).toHaveBeenCalledWith('team-123', 'upcoming');
    expect(mockEventsService.getEvents).toHaveBeenCalledWith('team-123', 'past');
  });

  it('should call addGoalNote and dismiss on submit', async () => {
    (component as any).noteContent.set('Great scan in transition');
    (component as any).selectedEventId.set('ev-1');
    (component as any).selectedStage.set('developing');

    await (component as any).submitNote();

    expect(mockGoalsService.addGoalNote).toHaveBeenCalledWith(
      'team-123',
      'g1',
      expect.objectContaining({
        eventId: 'ev-1',
        stage: 'developing',
        note: 'Great scan in transition',
      }),
    );
    expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(expect.objectContaining({ id: 'note-1' }));
  });
});
