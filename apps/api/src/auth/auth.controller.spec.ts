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
      const dto = { email: 'coach@test.com', password: 'Password123!', name: 'Coach' };
      mockAuthService.signup.mockResolvedValueOnce({ user: { id: '1' }, token: 'jwt-token' });

      const result = await controller.signup(dto);

      expect(mockAuthService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ user: { id: '1' }, token: 'jwt-token' });
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto = { email: 'coach@test.com', password: 'Password123!' };
      mockAuthService.login.mockResolvedValueOnce({ user: { id: '1' }, token: 'jwt-token' });

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ user: { id: '1' }, token: 'jwt-token' });
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with user details', async () => {
      mockAuthService.refresh.mockResolvedValueOnce({ token: 'new-token' });

      const result = await controller.refresh({ user: { sub: 'u1', email: 'coach@test.com' } });

      expect(mockAuthService.refresh).toHaveBeenCalledWith('u1', 'coach@test.com');
      expect(result).toEqual({ token: 'new-token' });
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
