import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    signup: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
  };

  const mockPasswordResetService = {
    createResetToken: vi.fn(),
    resetPassword: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: PasswordResetService,
          useValue: mockPasswordResetService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup', async () => {
      const dto = { email: 'coach@test.com', password: 'Password123!', displayName: 'Coach' };
      mockAuthService.signup.mockResolvedValueOnce({ accessToken: 'jwt-token' });

      const result = await controller.signup(dto);

      expect(mockAuthService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto = { email: 'coach@test.com', password: 'Password123!' };
      mockAuthService.login.mockResolvedValueOnce({ accessToken: 'jwt-token' });

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with user details', async () => {
      mockAuthService.refresh.mockResolvedValueOnce({ accessToken: 'new-token' });

      const result = await controller.refresh({ user: { sub: 'u1', email: 'coach@test.com' } });

      expect(mockAuthService.refresh).toHaveBeenCalledWith('u1', 'coach@test.com');
      expect(result).toEqual({ accessToken: 'new-token' });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const profile = { id: 'u1', email: 'coach@test.com', displayName: 'Coach Alex', createdAt: new Date() };
      mockAuthService.getProfile.mockResolvedValueOnce(profile);

      const result = await controller.getProfile({ user: { sub: 'u1', email: 'coach@test.com' } });

      expect(mockAuthService.getProfile).toHaveBeenCalledWith('u1');
      expect(result).toEqual(profile);
    });
  });

  describe('updateProfile', () => {
    it('should update and return profile', async () => {
      const updated = { id: 'u1', email: 'coach@test.com', displayName: 'Head Coach Alex' };
      mockAuthService.updateProfile.mockResolvedValueOnce(updated);

      const result = await controller.updateProfile(
        { user: { sub: 'u1', email: 'coach@test.com' } },
        { displayName: 'Head Coach Alex' },
      );

      expect(mockAuthService.updateProfile).toHaveBeenCalledWith('u1', { displayName: 'Head Coach Alex' });
      expect(result).toEqual(updated);
    });
  });

  describe('changePassword', () => {
    it('should call authService.changePassword', async () => {
      mockAuthService.changePassword.mockResolvedValueOnce({ message: 'Password updated successfully' });

      const result = await controller.changePassword(
        { user: { sub: 'u1', email: 'coach@test.com' } },
        { currentPassword: 'OldPassword1!', newPassword: 'NewPassword1!' },
      );

      expect(mockAuthService.changePassword).toHaveBeenCalledWith('u1', 'OldPassword1!', 'NewPassword1!');
      expect(result).toEqual({ message: 'Password updated successfully' });
    });
  });

  describe('deleteAccount', () => {
    it('should call authService.deleteAccount', async () => {
      mockAuthService.deleteAccount.mockResolvedValueOnce({ message: 'Account deleted successfully' });

      const result = await controller.deleteAccount({ user: { sub: 'u1', email: 'coach@test.com' } });

      expect(mockAuthService.deleteAccount).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ message: 'Account deleted successfully' });
    });
  });

  describe('forgotPassword', () => {
    it('should call passwordResetService.createResetToken', async () => {
      mockPasswordResetService.createResetToken.mockResolvedValueOnce({ message: 'Token generated' });

      const result = await controller.forgotPassword('coach@test.com');

      expect(mockPasswordResetService.createResetToken).toHaveBeenCalledWith('coach@test.com');
      expect(result).toEqual({ message: 'Token generated' });
    });
  });

  describe('resetPassword', () => {
    it('should call passwordResetService.resetPassword', async () => {
      mockPasswordResetService.resetPassword.mockResolvedValueOnce({ message: 'Password reset successful' });

      const result = await controller.resetPassword('reset-token', 'NewPassword123!');

      expect(mockPasswordResetService.resetPassword).toHaveBeenCalledWith('reset-token', 'NewPassword123!');
      expect(result).toEqual({ message: 'Password reset successful' });
    });
  });
});
