import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdpGrowthCardModalComponent } from './idp-growth-card-modal';
import { ModalController } from '@ionic/angular/standalone';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('IdpGrowthCardModalComponent', () => {
  let component: IdpGrowthCardModalComponent;
  let fixture: ComponentFixture<IdpGrowthCardModalComponent>;

  const mockModalCtrl = {
    dismiss: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdpGrowthCardModalComponent],
      providers: [{ provide: ModalController, useValue: mockModalCtrl }],
    }).compileComponents();

    fixture = TestBed.createComponent(IdpGrowthCardModalComponent);
    component = fixture.componentInstance;
    component.teamName = 'Apex Strikers';
    component.profile = {
      player: {
        id: 'p1',
        firstName: 'Alex',
        lastName: 'Morgan',
        jerseyNumber: 13,
        preferredPosition: 'Forward',
      },
      totalMinutes: 120,
      totalGamesPlayed: 3,
      totalGoals: 4,
      totalAssists: 2,
      totalBlockedShots: 0,
      totalBlockedPenaltyKicks: 0,
      positionDistribution: {},
      history: [],
    };
    component.goals = [];
    component.awards = [];
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call window.print when printCard is called', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    (component as any).printCard();
    expect(printSpy).toHaveBeenCalled();
  });
});
