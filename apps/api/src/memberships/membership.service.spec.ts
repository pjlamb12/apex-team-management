import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipService } from './membership.service';
import { TeamMemberEntity } from '../entities/team-member.entity';
import { TeamRole } from '@apex-team/shared/util/models';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MembershipService', () => {
  let service: MembershipService;
  let repo: Repository<TeamMemberEntity>;

  const mockRepo = {
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        {
          provide: getRepositoryToken(TeamMemberEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<MembershipService>(MembershipService);
    repo = module.get<Repository<TeamMemberEntity>>(getRepositoryToken(TeamMemberEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isMember', () => {
    it('should return true if membership exists', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: '1' });
      const result = await service.isMember('user1', 'team1');
      expect(result).toBe(true);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'user1', teamId: 'team1' } });
    });

    it('should return false if membership does not exist', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      const result = await service.isMember('user1', 'team1');
      expect(result).toBe(false);
    });
  });

  describe('getRole', () => {
    it('should return the role if membership exists', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ role: TeamRole.HEAD_COACH });
      const result = await service.getRole('user1', 'team1');
      expect(result).toBe(TeamRole.HEAD_COACH);
    });

    it('should return null if membership does not exist', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      const result = await service.getRole('user1', 'team1');
      expect(result).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true if user has one of the required roles', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ role: TeamRole.HEAD_COACH });
      const result = await service.hasRole('user1', 'team1', [TeamRole.HEAD_COACH, TeamRole.ASSISTANT]);
      expect(result).toBe(true);
    });

    it('should return false if user role is not in the required roles', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ role: TeamRole.ASSISTANT });
      const result = await service.hasRole('user1', 'team1', [TeamRole.HEAD_COACH]);
      expect(result).toBe(false);
    });

    it('should return false if membership does not exist', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      const result = await service.hasRole('user1', 'team1', [TeamRole.HEAD_COACH]);
      expect(result).toBe(false);
    });
  });
});
