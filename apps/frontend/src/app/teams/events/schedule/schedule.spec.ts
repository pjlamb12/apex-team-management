import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Schedule } from './schedule';
import { EventsService } from '../events.service';
import { SeasonsService } from '../../seasons/seasons.service';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

describe('Schedule', () => {
  let component: Schedule;
  let fixture: ComponentFixture<Schedule>;
  let eventsService: EventsService;
  let seasonsService: SeasonsService;

  beforeEach(async () => {
    const mockRuntimeConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    await TestBed.configureTestingModule({
      imports: [Schedule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Schedule);
    component = fixture.componentInstance;
    eventsService = TestBed.inject(EventsService);
    seasonsService = TestBed.inject(SeasonsService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load seasons and select active one by default', async () => {
    const seasons = [
      { id: 's1', name: 'Fall 2025', isActive: false },
      { id: 's2', name: 'Spring 2026', isActive: true },
    ];
    vi.spyOn(seasonsService, 'findAllForTeam').mockReturnValue(of(seasons as any));
    vi.spyOn(eventsService, 'getEvents').mockReturnValue(of([]));

    component.id = 't1';
    fixture.detectChanges();

    // Wait for effect to run
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(seasonsService.findAllForTeam).toHaveBeenCalledWith('t1');
    expect(component['seasons']()).toEqual(seasons);
    expect(component['selectedSeasonId']()).toBe('s2');
  });

  it('should load events for selected season', async () => {
    const seasons = [{ id: 's1', name: 'Fall 2025', isActive: true }];
    const events = [{ id: 'e1', type: 'game', opponent: 'Strikers', scheduledAt: '2025-10-10' }];
    
    vi.spyOn(seasonsService, 'findAllForTeam').mockReturnValue(of(seasons as any));
    vi.spyOn(eventsService, 'getEvents').mockReturnValue(of(events as any));

    component.id = 't1';
    fixture.detectChanges();

    // Wait for effect to run
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(eventsService.getEvents).toHaveBeenCalledWith('t1', 'upcoming', 's1');
    expect(component['events']()).toEqual(events);
  });
});
