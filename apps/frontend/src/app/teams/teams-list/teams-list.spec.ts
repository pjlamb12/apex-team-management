import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamsList } from './teams-list';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular/standalone';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { Router } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('TeamsList', () => {
  let component: TeamsList;
  let fixture: ComponentFixture<TeamsList>;
  let alertCtrlMock: Partial<AlertController>;
  let httpMock: Partial<HttpClient>;

  beforeEach(async () => {
    alertCtrlMock = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
      }),
    };
    httpMock = {
      get: vi.fn().mockReturnValue({ pipe: vi.fn() }),
      delete: vi.fn().mockReturnValue({ pipe: vi.fn() }),
    };

    await TestBed.configureTestingModule({
      imports: [TeamsList],
      providers: [
        { provide: HttpClient, useValue: httpMock },
        { provide: AlertController, useValue: alertCtrlMock },
        { provide: RuntimeConfigLoaderService, useValue: { getConfigObjectKey: () => 'http://localhost:3000' } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamsList);
    component = fixture.componentInstance;
  });

  describe('delete team (TEAM-05)', () => {
    it('should call AlertController.create when delete is triggered', async () => {
      const team = { id: 'team-1', name: 'Thunder FC', sport: { name: 'Soccer' } };
      await (component as unknown as { confirmDelete: (t: unknown) => Promise<void> }).confirmDelete(team);
      expect(alertCtrlMock.create).toHaveBeenCalled();
    });

    it('should present an alert with header "Delete Team"', async () => {
      const team = { id: 'team-1', name: 'Thunder FC', sport: { name: 'Soccer' } };
      await (component as unknown as { confirmDelete: (t: unknown) => Promise<void> }).confirmDelete(team);
      expect(alertCtrlMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ header: 'Delete Team' })
      );
    });
  });
});
