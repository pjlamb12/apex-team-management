import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { TacticsService } from './tactics.service';
import { TacticPlay } from '@apex-team/shared/util/models';

describe('TacticsService', () => {
  let service: TacticsService;
  let httpMock: HttpTestingController;

  const mockConfig = {
    getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TacticsService,
        { provide: RuntimeConfigLoaderService, useValue: mockConfig },
      ],
    });
    service = TestBed.inject(TacticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created with default soccer sport', () => {
    expect(service).toBeTruthy();
    expect(service.selectedSport()).toBe('soccer');
  });

  it('should load plays and update signals', () => {
    const mockPlays: TacticPlay[] = [
      {
        id: 'play-1',
        coachId: 'c-1',
        title: '4-3-3 Balanced',
        sport: 'soccer',
        category: 'formation',
        pitchType: 'full_pitch',
        tags: ['4-3-3'],
        canvasData: { pitchType: 'full_pitch', tokens: [], drawings: [] },
        createdAt: '2026-08-15',
        updatedAt: '2026-08-15',
      },
    ];

    service.loadPlays('soccer').subscribe((plays) => {
      expect(plays).toEqual(mockPlays);
      expect(service.plays()).toEqual(mockPlays);
      expect(service.filteredPlays()).toEqual(mockPlays);
    });

    const req = httpMock.expectOne((r) => r.url === 'http://api.test/tactics' && r.params.get('sport') === 'soccer');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlays);
  });

  it('should filter plays correctly by sport and category', () => {
    const mockPlays: TacticPlay[] = [
      {
        id: 'p1',
        coachId: 'c-1',
        title: 'Soccer 4-3-3',
        sport: 'soccer',
        category: 'formation',
        pitchType: 'full_pitch',
        tags: [],
        canvasData: { pitchType: 'full_pitch', tokens: [], drawings: [] },
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'p2',
        coachId: 'c-1',
        title: 'Volleyball 5-1',
        sport: 'volleyball',
        category: 'formation',
        pitchType: 'full_court',
        tags: [],
        canvasData: { pitchType: 'full_court', tokens: [], drawings: [] },
        createdAt: '',
        updatedAt: '',
      },
    ];

    service.loadPlays().subscribe();
    const req = httpMock.expectOne((r) => r.url === 'http://api.test/tactics');
    req.flush(mockPlays);

    // Initial sport is soccer
    expect(service.filteredPlays().length).toBe(1);
    expect(service.filteredPlays()[0].title).toBe('Soccer 4-3-3');

    // Switch to volleyball
    service.setSport('volleyball');
    const vbReq = httpMock.expectOne((r) => r.url === 'http://api.test/tactics' && r.params.get('sport') === 'volleyball');
    vbReq.flush(mockPlays);

    expect(service.filteredPlays().length).toBe(1);
    expect(service.filteredPlays()[0].title).toBe('Volleyball 5-1');
  });

  it('should create play and refresh list', () => {
    const dto = {
      title: 'New Play',
      sport: 'soccer' as const,
      category: 'set_piece' as const,
      canvasData: { pitchType: 'half_pitch' as const, tokens: [], drawings: [] },
    };
    const created: TacticPlay = {
      id: 'p-new',
      coachId: 'c-1',
      ...dto,
      pitchType: 'half_pitch',
      tags: [],
      createdAt: '',
      updatedAt: '',
    };

    service.createPlay(dto).subscribe();

    const postReq = httpMock.expectOne('http://api.test/tactics');
    expect(postReq.request.method).toBe('POST');
    postReq.flush(created);

    expect(service.activePlay()).toEqual(created);
    expect(service.plays()).toContainEqual(created);
  });

  it('should create play offline and queue synchronization', async () => {
    service.network.setOnlineStatus(false);
    const dto = {
      title: 'Offline Field Play',
      sport: 'soccer' as const,
      category: 'formation' as const,
      canvasData: { pitchType: 'full_pitch' as const, tokens: [], drawings: [] },
    };

    const createdOffline = await import('rxjs').then((m) => m.firstValueFrom(service.createPlay(dto)));

    expect(createdOffline).toBeTruthy();
    expect(createdOffline.id.startsWith('offline_')).toBe(true);
    expect(createdOffline.title).toBe('Offline Field Play');
    expect(service.network.pendingSyncCount()).toBeGreaterThanOrEqual(1);
  });
});
