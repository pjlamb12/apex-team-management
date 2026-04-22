import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EventsService } from './events.service';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

describe('EventsService', () => {
  let service: EventsService;
  let httpMock: HttpTestingController;
  const mockConfig = {
    getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EventsService,
        { provide: RuntimeConfigLoaderService, useValue: mockConfig },
      ],
    });
    service = TestBed.inject(EventsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch events for a team', () => {
    const teamId = 'team-1';
    const mockEvents = [{ id: '1', type: 'game' }];

    service.getEvents(teamId).subscribe((events) => {
      expect(events).toEqual(mockEvents);
    });

    const req = httpMock.expectOne((request) => 
      request.url.includes(`/teams/${teamId}/events`) && 
      request.params.get('scope') === 'upcoming'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockEvents);
  });

  it('should create an event', () => {
    const teamId = 'team-1';
    const dto = { type: 'practice' as const, scheduledAt: '2026-04-20T10:00:00Z' };
    const mockResponse = { id: 'new-1', ...dto };

    service.createEvent(teamId, dto).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/teams/${teamId}/events`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockResponse);
  });
});
