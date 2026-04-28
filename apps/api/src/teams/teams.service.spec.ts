import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TeamsService } from './teams.service';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TeamEntity } from '../entities/team.entity';
import { TeamMemberEntity } from '../entities/team-member.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TeamsJoinCodeService } from './teams.join-code.service';
import { TeamRole } from '@apex-team/shared/util/models';

describe('TeamsService', () => {
  let service: TeamsService;
  let teamRepo: Partial<Record<keyof Repository<TeamEntity>, any>>;
  let memberRepo: Partial<Record<keyof Repository<TeamMemberEntity>, any>>;
  let joinCodeService: Partial<TeamsJoinCodeService>;

  beforeEach(async () => {
    teamRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    memberRepo = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
    };

    joinCodeService = {
      generate: vi.fn().mockReturnValue('ABC123'),
    };

    const module = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: getRepositoryToken(TeamEntity), useValue: teamRepo },
        { provide: getRepositoryToken(TeamMemberEntity), useValue: memberRepo },
        { provide: TeamsJoinCodeService, useValue: joinCodeService },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  describe('create', () => {
    it('should persist a team and create a HEAD_COACH membership', async () => {
      const dto = { name: 'Thunder FC', sportId: 'sport-1' };
      const coachId = 'user-1';
      const savedTeam = { id: 'team-1', ...dto, coachId, joinCode: 'ABC123' };
      
      teamRepo.create.mockReturnValue(savedTeam);
      teamRepo.save.mockResolvedValue(savedTeam);
      memberRepo.create.mockReturnValue({ teamId: 'team-1', userId: coachId, role: TeamRole.HEAD_COACH });

      const result = await service.create(dto, coachId);

      expect(teamRepo.create).toHaveBeenCalled();
      expect(memberRepo.create).toHaveBeenCalledWith({
        teamId: 'team-1',
        userId: coachId,
        role: TeamRole.HEAD_COACH,
      });
      expect(result.joinCode).toBe('ABC123');
    });
  });

  describe('findAllByCoach', () => {
    it('should use query builder to find teams where user is member', async () => {
      const queryBuilder: Partial<SelectQueryBuilder<TeamEntity>> = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([{ id: 'team-1' }]),
      };
      
      teamRepo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAllByCoach('user-1');

      expect(teamRepo.createQueryBuilder).toHaveBeenCalledWith('team');
      expect(queryBuilder.where).toHaveBeenCalledWith('member.userId = :userId', { userId: 'user-1' });
      expect(result).toHaveLength(1);
    });
  });

  describe('join', () => {
    it('should add user as ASSISTANT if code matches', async () => {
      const team = { id: 'team-1', joinCode: 'ABC123' };
      teamRepo.findOne.mockResolvedValue(team);
      memberRepo.findOne.mockResolvedValue(null);
      memberRepo.create.mockReturnValue({ teamId: 'team-1', userId: 'user-2', role: TeamRole.ASSISTANT });

      const result = await service.join('user-2', 'ABC123');

      expect(memberRepo.create).toHaveBeenCalledWith({
        teamId: 'team-1',
        userId: 'user-2',
        role: TeamRole.ASSISTANT,
      });
      expect(result.id).toBe('team-1');
    });

    it('should throw NotFoundException if code invalid', async () => {
      teamRepo.findOne.mockResolvedValue(null);
      await expect(service.join('u1', 'BAD')).rejects.toThrow(NotFoundException);
    });

    it('should return team if already a member', async () => {
      const team = { id: 'team-1' };
      teamRepo.findOne.mockResolvedValue(team);
      memberRepo.findOne.mockResolvedValue({ id: 'm1' });

      const result = await service.join('u1', 'ABC123');

      expect(memberRepo.create).not.toHaveBeenCalled();
      expect(result.id).toBe('team-1');
    });
  });

  describe('regenerateCode', () => {
    it('should generate a new code and save team', async () => {
      const team = { id: 'team-1', joinCode: 'OLD' };
      teamRepo.findOne.mockResolvedValueOnce(team).mockResolvedValueOnce(null); // first findOne is getTeam, second is uniqueness check
      joinCodeService.generate.mockReturnValue('NEW123');
      teamRepo.save.mockResolvedValue({ ...team, joinCode: 'NEW123' });

      const result = await service.regenerateCode('team-1');

      expect(result.joinCode).toBe('NEW123');
      expect(teamRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if it cannot generate a unique code after retries', async () => {
      teamRepo.findOne.mockResolvedValue({ id: 'other-team' }); // Always find an existing team with the code
      await expect(service.regenerateCode('team-1')).rejects.toThrow(ConflictException);
    });
  });
});
