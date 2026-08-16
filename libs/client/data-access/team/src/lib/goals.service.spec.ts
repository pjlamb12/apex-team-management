import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GoalsService } from './goals.service';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

describe('GoalsService (client)', () => {
  let service: GoalsService;
  let httpMock: HttpTestingController;
  const mockConfig = {
    getConfigObjectKey: vi.fn().mockReturnValue('http://localhost:3000'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GoalsService,
        { provide: RuntimeConfigLoaderService, useValue: mockConfig },
      ],
    });
    service = TestBed.inject(GoalsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getPlayerGoals with correct URL and params', () => {
    const mockGoals = [{ id: 'g1', title: 'Scanning' }];
    service.getPlayerGoals('team-1', 'p1', 'season-1').subscribe((res) => {
      expect(res).toEqual(mockGoals);
    });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/teams/team-1/players/p1/goals') &&
      r.params.get('seasonId') === 'season-1'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockGoals);
  });

  it('should call createGoal with correct payload', () => {
    const dto = {
      playerId: 'p1',
      title: 'Weak-Foot Passing',
      category: 'technical' as const,
    };
    const mockResponse = { id: 'g1', ...dto };

    service.createGoal('team-1', 'p1', dto).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/teams/team-1/players/p1/goals');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockResponse);
  });

  it('should call updateGoal with correct payload', () => {
    const dto = { masteryStage: 'mastered' as const };
    const mockResponse = { id: 'g1', masteryStage: 'mastered' };

    service.updateGoal('team-1', 'g1', dto).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/teams/team-1/goals/g1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(dto);
    req.flush(mockResponse);
  });

  it('should call addGoalNote with correct payload', () => {
    const noteDto = { note: 'Solid scanning in game' };
    const mockResponse = { id: 'n1', ...noteDto };

    service.addGoalNote('team-1', 'g1', noteDto).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/teams/team-1/goals/g1/notes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(noteDto);
    req.flush(mockResponse);
  });

  it('should call deleteGoal', () => {
    service.deleteGoal('team-1', 'g1').subscribe((res) => {
      expect(res).toEqual({ success: true, id: 'g1' });
    });

    const req = httpMock.expectOne('http://localhost:3000/teams/team-1/goals/g1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, id: 'g1' });
  });
});
