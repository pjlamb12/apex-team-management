import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Shell } from './shell';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the shell component', () => {
    expect(component).toBeTruthy();
  });

  it('should render an ion-tabs element', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('ion-tabs')).toBeTruthy();
  });

  it('should render an ion-tab-bar with the Teams, Drills, and Playbook tab buttons', () => {
    const el: HTMLElement = fixture.nativeElement;
    const tabBar = el.querySelector('ion-tab-bar');
    expect(tabBar).toBeTruthy();
    const tabs = el.querySelectorAll('ion-tab-button');
    expect(tabs.length).toBe(3);
  });
});
