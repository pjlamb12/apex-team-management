import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientFeatureGameConsole } from './client-feature-game-console';

describe('ClientFeatureGameConsole', () => {
  let component: ClientFeatureGameConsole;
  let fixture: ComponentFixture<ClientFeatureGameConsole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientFeatureGameConsole],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientFeatureGameConsole);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
