import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateTeam } from './create-team';
import { HttpClient } from '@angular/common/http';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('CreateTeam', () => {
  let component: CreateTeam;
  let fixture: ComponentFixture<CreateTeam>;
  let httpMock: Partial<HttpClient>;
  let router: Router;

  beforeEach(async () => {
    httpMock = {
      get: vi.fn().mockReturnValue(of([])),
      post: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [CreateTeam],
      providers: [
        { provide: HttpClient, useValue: httpMock },
        { provide: RuntimeConfigLoaderService, useValue: { getConfigObjectKey: () => 'http://localhost:3000' } },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTeam);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  describe('sport dropdown (TEAM-02)', () => {
    it('should load sports from GET /sports on init', async () => {
      const sports = [{ id: 'sport-1', name: 'Soccer', isEnabled: true }];
      (httpMock.get as ReturnType<typeof vi.fn>).mockReturnValue(of(sports));
      // Trigger ngOnInit
      fixture.detectChanges();
      expect(httpMock.get).toHaveBeenCalledWith(expect.stringContaining('/sports'));
    });
  });

  describe('form submit (TEAM-01)', () => {
    it('should navigate to /teams after successful form submit', async () => {
      // Set up form with valid data
      component['form'].setValue({ name: 'Thunder FC', sportId: 'sport-1' });
      // Mock successful POST
      (httpMock.post as ReturnType<typeof vi.fn>).mockReturnValue(of({ id: 'team-1', name: 'Thunder FC' }));

      await (component as unknown as { submit: () => Promise<void> }).submit();

      expect(router.navigate).toHaveBeenCalledWith(['/teams']);
    });

    it('should not submit if form is invalid', async () => {
      component['form'].setValue({ name: '', sportId: '' });
      await (component as unknown as { submit: () => Promise<void> }).submit();
      expect(httpMock.post).not.toHaveBeenCalled();
    });
  });
});
