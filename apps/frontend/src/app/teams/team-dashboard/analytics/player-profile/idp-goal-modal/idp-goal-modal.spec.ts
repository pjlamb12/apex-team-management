import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdpGoalModalComponent } from './idp-goal-modal';
import { GoalsService } from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('IdpGoalModalComponent', () => {
  let component: IdpGoalModalComponent;
  let fixture: ComponentFixture<IdpGoalModalComponent>;

  const mockGoalsService = {
    createGoal: vi.fn().mockReturnValue(of({ id: 'g1', title: 'Weak foot' })),
    updateGoal: vi.fn().mockReturnValue(of({ id: 'g1', title: 'Weak foot updated' })),
  };

  const mockModalCtrl = {
    dismiss: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdpGoalModalComponent],
      providers: [
        { provide: GoalsService, useValue: mockGoalsService },
        { provide: ModalController, useValue: mockModalCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IdpGoalModalComponent);
    component = fixture.componentInstance;
    component.teamId = 'team-123';
    component.playerId = 'player-456';
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should populate presets when applied', () => {
    (component as any).applyPreset({
      title: 'Scan Field Before Receiving',
      category: 'tactical',
      description: 'Look over shoulders',
      defaultTimeframe: 'mid_season',
      suggestedFocus: 'Vision',
    });

    expect((component as any).title()).toBe('Scan Field Before Receiving');
    expect((component as any).category()).toBe('tactical');
    expect((component as any).timeframe()).toBe('mid_season');
  });

  it('should call createGoal and dismiss on saveGoal', async () => {
    (component as any).title.set('Weak foot pass');
    (component as any).category.set('technical');

    await (component as any).saveGoal();

    expect(mockGoalsService.createGoal).toHaveBeenCalledWith(
      'team-123',
      'player-456',
      expect.objectContaining({
        title: 'Weak foot pass',
        category: 'technical',
      }),
    );
    expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(expect.objectContaining({ id: 'g1' }));
  });
});
