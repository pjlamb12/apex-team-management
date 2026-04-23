import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { DrillService } from './drill.service';
import { Drill, Tag } from './drill.model';

describe('DrillService', () => {
  let service: DrillService;
  let httpMock: HttpTestingController;

  const mockConfig = {
    getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DrillService,
        { provide: RuntimeConfigLoaderService, useValue: mockConfig },
      ],
    });
    service = TestBed.inject(DrillService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch drills', () => {
    const mockDrills: Drill[] = [{ id: '1', name: 'Drill 1' } as Drill];
    
    service.getDrills().subscribe(drills => {
      expect(drills).toEqual(mockDrills);
      expect(service.drills()).toEqual(mockDrills);
    });

    const req = httpMock.expectOne('http://api.test/drills');
    expect(req.request.method).toBe('GET');
    req.flush(mockDrills);
  });

  it('should fetch drills with tags', () => {
    const mockDrills: Drill[] = [{ id: '1', name: 'Drill 1' } as Drill];
    const tags = ['shooting', 'dribbling'];
    
    service.getDrills(tags).subscribe();

    const req = httpMock.expectOne(req => req.url === 'http://api.test/drills' && req.params.get('tags') === 'shooting,dribbling');
    expect(req.request.method).toBe('GET');
    req.flush(mockDrills);
  });

  it('should fetch tags', () => {
    const mockTags: Tag[] = [{ id: 't1', name: 'tag1' } as Tag];
    
    service.getTags().subscribe(tags => {
      expect(tags).toEqual(mockTags);
      expect(service.tags()).toEqual(mockTags);
    });

    const req = httpMock.expectOne('http://api.test/drills/tags');
    expect(req.request.method).toBe('GET');
    req.flush(mockTags);
  });

  it('should create a drill and refresh state', () => {
    const dto = { name: 'New Drill', description: 'Desc', instructions: {}, tagNames: ['tag1'] };
    const mockDrill = { id: 'd1', ...dto, tags: [], coachId: 'c1', createdAt: '', updatedAt: '' } as Drill;
    
    service.createDrill(dto).subscribe();

    // Mock the POST request
    const postReq = httpMock.expectOne('http://api.test/drills');
    expect(postReq.request.method).toBe('POST');
    postReq.flush(mockDrill);

    // Should refresh drills and tags
    const drillsReq = httpMock.expectOne('http://api.test/drills');
    expect(drillsReq.request.method).toBe('GET');
    drillsReq.flush([mockDrill]);

    const tagsReq = httpMock.expectOne('http://api.test/drills/tags');
    expect(tagsReq.request.method).toBe('GET');
    tagsReq.flush([]);
  });
});
