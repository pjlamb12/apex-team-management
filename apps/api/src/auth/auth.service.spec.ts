import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { UserEntity } from '../entities/user.entity';
import { TeamsService } from '../teams/teams.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepo = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };

  const mockJwtService = {
    sign: vi.fn().mockReturnValue('jwt-token'),
  };

  const mockTeamsService = {
    findAllByCoach: vi.fn().mockResolvedValue([]),
    remove: vi.fn().mockResolvedValue(undefined),
  };

  const mockRepository = {
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockDataSource = {
    getRepository: vi.fn().mockReturnValue(mockRepository),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should throw ConflictException if email exists', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 'u1', email: 'test@example.com' });
      await expect(
        service.signup({ email: 'test@example.com', password: 'Password1!', displayName: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and save user with hashed password and return token', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      mockUserRepo.create.mockReturnValueOnce({
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Test',
      });
      mockUserRepo.save.mockResolvedValueOnce({
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Test',
      });

      const res = await service.signup({
        email: 'test@example.com',
        password: 'Password1!',
        displayName: 'Test',
      });

      expect(mockUserRepo.create).toHaveBeenCalled();
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'test@example.com',
        displayName: 'Test',
      });
      expect(res).toEqual({ accessToken: 'jwt-token' });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.login({ email: 'unknown@example.com', password: 'Password1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hash = await bcrypt.hash('CorrectPass1!', 10);
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Test',
        passwordHash: hash,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return token if credentials match', async () => {
      const hash = await bcrypt.hash('CorrectPass1!', 10);
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Test',
        passwordHash: hash,
      });

      const res = await service.login({ email: 'test@example.com', password: 'CorrectPass1!' });
      expect(res).toEqual({ accessToken: 'jwt-token' });
    });
  });

  describe('getProfile', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.getProfile('unknown')).rejects.toThrow(NotFoundException);
    });

    it('should return user profile', async () => {
      const now = new Date();
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Coach Alex',
        createdAt: now,
      });

      const profile = await service.getProfile('u1');
      expect(profile).toEqual({
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Coach Alex',
        createdAt: now,
      });
    });
  });

  describe('updateProfile', () => {
    it('should update displayName and save user', async () => {
      const user = {
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Old Name',
      };
      mockUserRepo.findOne.mockResolvedValueOnce(user);
      mockUserRepo.save.mockResolvedValueOnce({ ...user, displayName: 'New Name' });

      const updated = await service.updateProfile('u1', { displayName: 'New Name' });
      expect(user.displayName).toBe('New Name');
      expect(mockUserRepo.save).toHaveBeenCalledWith(user);
      expect(updated).toEqual({
        id: 'u1',
        email: 'test@example.com',
        displayName: 'New Name',
      });
    });
  });

  describe('changePassword', () => {
    it('should throw UnauthorizedException if current password incorrect', async () => {
      const hash = await bcrypt.hash('CurrentPass1!', 10);
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 'u1',
        passwordHash: hash,
      });

      await expect(
        service.changePassword('u1', 'WrongCurrentPass!', 'NewPassword1!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update password hash if current password is correct', async () => {
      const hash = await bcrypt.hash('CurrentPass1!', 10);
      const user = {
        id: 'u1',
        passwordHash: hash,
      };
      mockUserRepo.findOne.mockResolvedValueOnce(user);
      mockUserRepo.save.mockResolvedValueOnce(user);

      const res = await service.changePassword('u1', 'CurrentPass1!', 'NewPassword1!');
      expect(res).toEqual({ message: 'Password updated successfully' });
      expect(mockUserRepo.save).toHaveBeenCalled();
      const isMatch = await bcrypt.compare('NewPassword1!', user.passwordHash);
      expect(isMatch).toBe(true);
    }, 15000);
  });

  describe('deleteAccount', () => {
    it('should delete user owned teams, memberships, associated entities, and user entity', async () => {
      const user = { id: 'u1', email: 'test@example.com' };
      mockUserRepo.findOne.mockResolvedValueOnce(user);
      mockTeamsService.findAllByCoach.mockResolvedValueOnce([
        { id: 't1', coachId: 'u1' },
        { id: 't2', coachId: 'other-coach' }, // member only
      ]);

      const res = await service.deleteAccount('u1');

      expect(mockTeamsService.remove).toHaveBeenCalledWith('t1', 'u1');
      expect(mockTeamsService.remove).not.toHaveBeenCalledWith('t2', 'u1');
      expect(mockRepository.delete).toHaveBeenCalledWith({ userId: 'u1' });
      expect(mockRepository.delete).toHaveBeenCalledWith({ coachId: 'u1' });
      expect(mockUserRepo.remove).toHaveBeenCalledWith(user);
      expect(res).toEqual({ message: 'Account deleted successfully' });
    });
  });
});
