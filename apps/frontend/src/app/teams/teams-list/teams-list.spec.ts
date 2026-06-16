import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamsList } from './teams-list';
import { HttpClient } from '@angular/common/http';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { provideRouter } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('TeamsList', () => {
  let component: TeamsList;
  let fixture: ComponentFixture<TeamsList>;
  let alertCtrlMock: Partial<AlertController>;
  let modalCtrlMock: Partial<ModalController>;
  let httpMock: Partial<HttpClient>;

  beforeEach(async () => {
    alertCtrlMock = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
      }),
    };
    modalCtrlMock = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onWillDismiss: vi.fn().mockResolvedValue({ data: undefined, role: 'cancel' }),
      }),
    };
    httpMock = {
      get: vi.fn().mockReturnValue({ pipe: vi.fn() }),
      delete: vi.fn().mockReturnValue({ pipe: vi.fn() }),
      post: vi.fn().mockReturnValue({ pipe: vi.fn() }),
    };

    await TestBed.configureTestingModule({
      imports: [TeamsList],
      providers: [
        { provide: HttpClient, useValue: httpMock },
        { provide: AlertController, useValue: alertCtrlMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: RuntimeConfigLoaderService, useValue: { getConfigObjectKey: () => 'http://localhost:3000' } },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamsList);
    component = fixture.componentInstance;
  });

  describe('delete team (TEAM-05)', () => {
    it('should call AlertController.create when delete is triggered', async () => {
      const team = { id: 'team-1', name: 'Thunder FC', sport: { name: 'Soccer' } };
      const mockEvent = {
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as Event;
      await (component as unknown as { confirmDelete: (e: Event, t: unknown) => Promise<void> }).confirmDelete(mockEvent, team);
      expect(alertCtrlMock.create).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should present an alert with header "Delete Team"', async () => {
      const team = { id: 'team-1', name: 'Thunder FC', sport: { name: 'Soccer' } };
      const mockEvent = {
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      } as unknown as Event;
      await (component as unknown as { confirmDelete: (e: Event, t: unknown) => Promise<void> }).confirmDelete(mockEvent, team);
      expect(alertCtrlMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ header: 'Delete Team' })
      );
    });
  });

  describe('Easter Egg - Generate Demo Team', () => {
    it('should not trigger alert if tapped fewer than 5 times', async () => {
      await (component as any).onHeaderTap();
      await (component as any).onHeaderTap();
      expect(alertCtrlMock.create).not.toHaveBeenCalled();
    });

    it('should trigger alert if tapped 5 times within 2 seconds', async () => {
      vi.useFakeTimers();
      for (let i = 0; i < 5; i++) {
        await (component as any).onHeaderTap();
        vi.advanceTimersByTime(100);
      }
      expect(alertCtrlMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ header: 'Generate Demo Team?' })
      );
      vi.useRealTimers();
    });

    it('should not trigger alert if 5 taps take longer than 2 seconds', async () => {
      vi.useFakeTimers();
      await (component as any).onHeaderTap();
      vi.advanceTimersByTime(600);
      await (component as any).onHeaderTap();
      vi.advanceTimersByTime(600);
      await (component as any).onHeaderTap();
      vi.advanceTimersByTime(600);
      await (component as any).onHeaderTap();
      vi.advanceTimersByTime(600);
      await (component as any).onHeaderTap();
      
      expect(alertCtrlMock.create).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
