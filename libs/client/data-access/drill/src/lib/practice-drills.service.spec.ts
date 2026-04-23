import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { PracticeDrillsService } from './practice-drills.service';

describe('PracticeDrillsService', () => {
  let service: PracticeDrillsService;
  let httpMock: HttpTestingController;

  const mockConfig = {
    getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PracticeDrillsService,
        { provide: RuntimeConfigLoaderService, useValue: mockConfig },
      ],
    });
    service = TestBed.inject(PracticeDrillsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get practice plan', () => {
    service.getPlan('team-1', 'event-1').subscribe((plan) => {
      expect(plan).toEqual([]);
    });

    const req = httpMock.expectOne('http://api.test/teams/team-1/events/event-1/drills');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should add drill to plan', () => {
    const dto = { drillId: 'drill-1', durationMinutes: 10 };
    service.addDrill('team-1', 'event-1', dto).subscribe();

    const req = httpMock.expectOne('http://api.test/teams/team-1/events/event-1/drills');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({});
  });

  it('should reorder drills', () => {
    const ids = ['id-1', 'id-2'];
    service.reorderDrills('team-1', 'event-1', ids).subscribe();

    const req = httpMock.expectOne('http://api.test/teams/team-1/events/event-1/drills/reorder');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ ids });
    req.flush({});
  });
});
