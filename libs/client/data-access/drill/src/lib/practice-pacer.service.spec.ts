import { TestBed } from '@angular/core/testing';
import { PracticePacerService } from './practice-pacer.service';
import { PracticeDrill } from './drill.model';
import { Haptics } from '@capacitor/haptics';

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn(),
    vibrate: vi.fn(),
  },
}));

describe('PracticePacerService', () => {
  let service: PracticePacerService;

  const mockDrills: PracticeDrill[] = [
    { id: '1', drillId: 'd1', eventId: 'e1', sequence: 1, durationMinutes: 1, teamRating: null, notes: null, drill: { name: 'Drill 1' } as any },
    { id: '2', drillId: 'd2', eventId: 'e1', sequence: 2, durationMinutes: 2, teamRating: null, notes: null, drill: { name: 'Drill 2' } as any },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PracticePacerService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with first drill', () => {
    service.initialize('practice-1', mockDrills);
    expect(service.currentDrill()).toEqual(mockDrills[0]);
    expect(service.remainingSeconds()).toBe(60);
    expect(service.isRunning()).toBe(false);
  });

  it('should start and decrement timer', async () => {
    service.initialize('practice-1', mockDrills);
    await service.start();
    expect(service.isRunning()).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(service.remainingSeconds()).toBe(59);

    vi.advanceTimersByTime(59000);
    expect(service.remainingSeconds()).toBe(0);
    expect(Haptics.vibrate).toHaveBeenCalled();

    await service.pause();
    expect(service.isRunning()).toBe(false);
  });

  it('should advance to next drill', () => {
    service.initialize('practice-1', mockDrills);
    service.next();
    expect(service.currentDrill()).toEqual(mockDrills[1]);
    expect(service.remainingSeconds()).toBe(120);
    expect(service.activeDrillIndex()).toBe(1);
  });

  it('should handle finishing the plan', () => {
    service.initialize('practice-1', mockDrills);
    service.next();
    service.next();
    expect(service.isFinished()).toBe(true);
    expect(service.isRunning()).toBe(false);
  });

  it('should persist and restore state', () => {
    service.initialize('practice-1', mockDrills);
    service.next();
    
    // Reset and create a new instance to simulate a reload
    TestBed.resetTestingModule();
    const service2 = TestBed.configureTestingModule({
      providers: [PracticePacerService]
    }).inject(PracticePacerService);
    
    service2.initialize('practice-1', mockDrills);
    expect(service2.activeDrillIndex()).toBe(1);
    expect(service2.currentDrill()?.id).toBe('2');
  });

  it('should reset to start', () => {
    service.initialize('practice-1', mockDrills);
    service.next();
    service.reset();
    expect(service.activeDrillIndex()).toBe(0);
    expect(service.remainingSeconds()).toBe(60);
  });
});
