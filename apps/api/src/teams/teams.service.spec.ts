import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TeamsService } from './teams.service';
import { Repository } from 'typeorm';
import { TeamEntity } from '../entities/team.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

describe('TeamsService', () => {
  let service: TeamsService;
  let teamRepo: Partial<Record<keyof Repository<TeamEntity>, ReturnType<typeof vi.fn>>>;

  beforeEach(async () => {
    teamRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: getRepositoryToken(TeamEntity), useValue: teamRepo },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  describe('create (TEAM-01)', () => {
    it('should persist a team with the given name and sportId and coachId', async () => {
      const dto = { name: 'Thunder FC', sportId: 'sport-uuid-1' };
      const coachId = 'coach-uuid-1';
      const saved = { id: 'team-uuid-1', name: dto.name, sportId: dto.sportId, coachId };
      teamRepo['create']!.mockReturnValue(saved);
      teamRepo['save']!.mockResolvedValue(saved);

      const result = await service.create(dto, coachId);

      expect(teamRepo['create']).toHaveBeenCalledWith({ name: dto.name, sportId: dto.sportId, coachId });
      expect(result.name).toBe('Thunder FC');
    });
  });

  describe('findAllByCoach (TEAM-01)', () => {
    it('should return only teams belonging to the given coachId', async () => {
      const teams = [{ id: 'team-1', coachId: 'coach-1' }];
      teamRepo['find']!.mockResolvedValue(teams);

      const result = await service.findAllByCoach('coach-1');

      expect(teamRepo['find']).toHaveBeenCalledWith(expect.objectContaining({ where: { coachId: 'coach-1' } }));
      expect(result).toHaveLength(1);
    });
  });

  describe('update (TEAM-04)', () => {
    it('should update team name and not change sportId', async () => {
      const existing = { id: 'team-1', name: 'Old Name', sportId: 'sport-1', coachId: 'coach-1' };
      const saved = { ...existing, name: 'New Name' };
      teamRepo['findOne']!.mockResolvedValue(existing);
      teamRepo['save']!.mockResolvedValue(saved);

      const result = await service.update('team-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(result.sportId).toBe('sport-1');
    });

    it('should throw NotFoundException when team does not exist', async () => {
      teamRepo['findOne']!.mockResolvedValue(null);
      await expect(service.update('bad-id', { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (TEAM-05)', () => {
    it('should delete the team by id', async () => {
      const team = { id: 'team-1', name: 'Thunder FC', coachId: 'coach-1' };
      teamRepo['findOne']!.mockResolvedValue(team);
      teamRepo['remove']!.mockResolvedValue(team);

      await service.remove('team-1');

      expect(teamRepo['remove']).toHaveBeenCalledWith(team);
    });

    it('should throw NotFoundException when team does not exist', async () => {
      teamRepo['findOne']!.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
