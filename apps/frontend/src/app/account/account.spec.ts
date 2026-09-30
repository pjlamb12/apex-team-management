import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountSettings } from './account';
import { AuthService } from '../auth/auth.service';

describe('AccountSettings', () => {
  let component: AccountSettings;
  let fixture: ComponentFixture<AccountSettings>;

  const mockProfile = {
    id: 'u1',
    email: 'coach@test.com',
    displayName: 'Coach Alex',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockAuthService = {
    currentUser: signal({ id: 'u1', email: 'coach@test.com', displayName: 'Coach Alex' }),
    getProfile: vi.fn().mockResolvedValue(mockProfile),
    updateProfile: vi.fn().mockResolvedValue({ ...mockProfile, displayName: 'New Name' }),
    changePassword: vi.fn().mockResolvedValue({ message: 'Password updated' }),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
  };

  let mockAlert: { present: ReturnType<typeof vi.fn> };
  const mockAlertCtrl = {
    create: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAlert = { present: vi.fn().mockResolvedValue(undefined) };
    mockAlertCtrl.create.mockResolvedValue(mockAlert);

    await TestBed.configureTestingModule({
      imports: [AccountSettings],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: AlertController, useValue: mockAlertCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load profile on init', async () => {
    expect(component).toBeTruthy();
    expect(mockAuthService.getProfile).toHaveBeenCalled();
    // Allow promises to resolve
    await fixture.whenStable();
    expect(component['profile']()?.displayName).toBe('Coach Alex');
    expect(component['profileForm'].value.displayName).toBe('Coach Alex');
  });

  it('should update profile when saveProfile is called', async () => {
    await fixture.whenStable();
    component['profileForm'].setValue({ displayName: 'New Name' });

    await component['saveProfile']();

    expect(mockAuthService.updateProfile).toHaveBeenCalledWith('New Name');
    expect(component['profile']()?.displayName).toBe('New Name');
    expect(component['profileMessage']()).toBe('Profile updated successfully.');
  });

  it('should not submit profile if form is invalid', async () => {
    component['profileForm'].setValue({ displayName: '' });
    await component['saveProfile']();
    expect(mockAuthService.updateProfile).not.toHaveBeenCalled();
  });

  it('should validate passwords match before calling changePassword', async () => {
    component['passwordForm'].setValue({
      currentPassword: 'OldPassword1!',
      newPassword: 'NewPassword1!',
      confirmPassword: 'DifferentPassword!',
    });

    await component['changePassword']();

    expect(mockAuthService.changePassword).not.toHaveBeenCalled();
    expect(component['passwordError']()).toBe('New passwords do not match.');
  });

  it('should submit changePassword when passwords match and form is valid', async () => {
    component['passwordForm'].setValue({
      currentPassword: 'OldPassword1!',
      newPassword: 'NewPassword1!',
      confirmPassword: 'NewPassword1!',
    });

    await component['changePassword']();

    expect(mockAuthService.changePassword).toHaveBeenCalledWith('OldPassword1!', 'NewPassword1!');
    expect(component['passwordMessage']()).toBe('Password changed successfully.');
  });

  it('should call authService.logout on logout', () => {
    component['logout']();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should present confirmation alert when confirmDeleteAccount is called', async () => {
    await component['confirmDeleteAccount']();
    expect(mockAlertCtrl.create).toHaveBeenCalled();
    expect(mockAlert.present).toHaveBeenCalled();

    // Trigger the handler
    const alertConfig = mockAlertCtrl.create.mock.calls[0][0];
    const deleteButton = alertConfig.buttons.find((b: { role?: string }) => b.role === 'destructive');
    expect(deleteButton).toBeDefined();

    await deleteButton.handler();
    expect(mockAuthService.deleteAccount).toHaveBeenCalled();
  });
});
