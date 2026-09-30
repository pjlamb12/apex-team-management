import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { AccessDenied } from './access-denied';

describe('AccessDenied', () => {
  let component: AccessDenied;
  let fixture: ComponentFixture<AccessDenied>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessDenied],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessDenied);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display access denied heading and explanation', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Access Denied');
    expect(el.textContent).toContain("You don't have permission to access this team or resource");
  });

  it('should have a button linking back to /teams', () => {
    const linkDebugEl = fixture.debugElement.query(By.directive(RouterLink));
    expect(linkDebugEl).toBeTruthy();
    const routerLink = linkDebugEl.injector.get(RouterLink);
    expect(routerLink.urlTree?.toString()).toBe('/teams');
  });
});
