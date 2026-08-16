import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoalsService } from './goals.service';
import { NotFoundException } from '@nestjs/common';

describe('GoalsService', () => {
  let service: GoalsService;
  let mockGoalRepo: any;
  let mockNoteRepo: any;
  let mockPlayerRepo: any;
  let mockEventRepo: any;

  beforeEach(() => {
    mockGoalRepo = {
      createQueryBuilder: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((entity) => ({ id: 'goal-1', ...entity })),
      save: vi.fn((entity) => Promise.resolve({ id: entity.id || 'goal-1', ...entity })),
      remove: vi.fn().mockResolvedValue(true),
    };

    mockNoteRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((entity) => ({ id: 'note-1', ...entity })),
      save: vi.fn((entity) => Promise.resolve({ id: entity.id || 'note-1', ...entity })),
      remove: vi.fn().mockResolvedValue(true),
    };

    mockPlayerRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
    };

    mockEventRepo = {
      findOne: vi.fn(),
    };

    service = new GoalsService(
      mockGoalRepo,
      mockNoteRepo,
      mockPlayerRepo,
      mockEventRepo,
    );
  });

  describe('findAll', () => {
    it('should query goals with filters', async () => {
      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          {
            id: 'goal-1',
            title: 'Scan Field Before Receiving',
            category: 'tactical',
            masteryStage: 'developing',
          },
        ]),
      };
      mockGoalRepo.createQueryBuilder.mockReturnValue(mockQb);

      const res = await service.findAll('team-1', {
        seasonId: 'season-1',
        category: 'tactical',
        status: 'in_progress',
      });

      expect(mockGoalRepo.createQueryBuilder).toHaveBeenCalledWith('goal');
      expect(mockQb.where).toHaveBeenCalledWith('goal.team_id = :teamId', { teamId: 'team-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('goal.season_id = :seasonId', { seasonId: 'season-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('goal.category = :category', { category: 'tactical' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('goal.status = :status', { status: 'in_progress' });
      expect(res).toHaveLength(1);
    });
  });

  describe('findByPlayer', () => {
    it('should return player goals', async () => {
      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          { id: 'goal-1', title: 'Weak-foot passing' },
        ]),
      };
      mockGoalRepo.createQueryBuilder.mockReturnValue(mockQb);

      const res = await service.findByPlayer('team-1', 'p1', 's1');
      expect(mockQb.where).toHaveBeenCalledWith('goal.team_id = :teamId', { teamId: 'team-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('goal.player_id = :playerId', { playerId: 'p1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('goal.season_id = :seasonId', { seasonId: 's1' });
      expect(res).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should throw NotFoundException if player does not exist', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('team-1', 'p1', {
          playerId: 'p1',
          title: 'Scan Field',
          category: 'tactical',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and save a new player goal', async () => {
      mockPlayerRepo.findOne.mockResolvedValue({ id: 'p1', teamId: 'team-1' });
      mockGoalRepo.findOne.mockResolvedValue({
        id: 'goal-1',
        teamId: 'team-1',
        playerId: 'p1',
        title: 'Scan Field',
        category: 'tactical',
        status: 'in_progress',
        masteryStage: 'emerging',
      });

      const res = await service.create('team-1', 'p1', {
        playerId: 'p1',
        title: 'Scan Field',
        category: 'tactical',
        timeframe: 'mid_season',
      });

      expect(mockGoalRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-1',
          playerId: 'p1',
          title: 'Scan Field',
          category: 'tactical',
          timeframe: 'mid_season',
          status: 'in_progress',
          masteryStage: 'emerging',
        }),
      );
      expect(res.id).toBe('goal-1');
    });
  });

  describe('update', () => {
    it('should update goal details and auto-update status when mastered', async () => {
      const existing = {
        id: 'goal-1',
        teamId: 'team-1',
        title: 'Scan Field',
        masteryStage: 'developing',
        status: 'in_progress',
      };
      mockGoalRepo.findOne.mockResolvedValue(existing);

      const res = await service.update('team-1', 'goal-1', {
        masteryStage: 'mastered',
      });

      expect(mockGoalRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          masteryStage: 'mastered',
          status: 'mastered',
        }),
      );
    });
  });

  describe('remove', () => {
    it('should remove goal', async () => {
      const existing = { id: 'goal-1', teamId: 'team-1' };
      mockGoalRepo.findOne.mockResolvedValue(existing);

      const res = await service.remove('team-1', 'goal-1');
      expect(mockGoalRepo.remove).toHaveBeenCalledWith(existing);
      expect(res.success).toBe(true);
    });
  });

  describe('addNote', () => {
    it('should add observation note and update goal stage', async () => {
      const goal = {
        id: 'goal-1',
        teamId: 'team-1',
        playerId: 'p1',
        masteryStage: 'emerging',
        status: 'in_progress',
      };
      mockGoalRepo.findOne.mockResolvedValue(goal);
      mockEventRepo.findOne.mockResolvedValue({ id: 'e1', teamId: 'team-1' });
      mockNoteRepo.findOne.mockResolvedValue({
        id: 'note-1',
        goalId: 'goal-1',
        stage: 'developing',
        note: 'Great scanning during practice scrimmage',
        event: { id: 'e1' },
      });

      const note = await service.addNote('team-1', 'goal-1', {
        eventId: 'e1',
        stage: 'developing',
        note: 'Great scanning during practice scrimmage',
      });

      expect(mockNoteRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: 'goal-1',
          playerId: 'p1',
          eventId: 'e1',
          stage: 'developing',
          note: 'Great scanning during practice scrimmage',
        }),
      );
      expect(mockGoalRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          masteryStage: 'developing',
        }),
      );
      expect(note.id).toBe('note-1');
    });
  });

  describe('getSummary', () => {
    it('should compute team goals summary', async () => {
      mockPlayerRepo.find.mockResolvedValue([
        { id: 'p1', firstName: 'Alex', lastName: 'Morgan', jerseyNumber: 13 },
        { id: 'p2', firstName: 'Megan', lastName: 'Rapinoe', jerseyNumber: 15 },
      ]);

      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          {
            id: 'g1',
            playerId: 'p1',
            category: 'tactical',
            status: 'in_progress',
            masteryStage: 'emerging',
          },
          {
            id: 'g2',
            playerId: 'p1',
            category: 'technical',
            status: 'mastered',
            masteryStage: 'mastered',
          },
        ]),
      };
      mockGoalRepo.createQueryBuilder.mockReturnValue(mockQb);

      const summary = await service.getSummary('team-1');

      expect(summary.totalGoals).toBe(2);
      expect(summary.activeGoals).toBe(1);
      expect(summary.masteredGoals).toBe(1);
      expect(summary.goalsByCategory.tactical).toBe(1);
      expect(summary.goalsByCategory.technical).toBe(1);
      expect(summary.goalsByStage.emerging).toBe(1);
      expect(summary.goalsByStage.mastered).toBe(1);
      expect(summary.playerGoalsCount).toHaveLength(2);
      expect(summary.playerGoalsCount[0].totalGoals).toBe(2);
      expect(summary.playerGoalsCount[0].masteredGoals).toBe(1);
      expect(summary.playerGoalsCount[1].totalGoals).toBe(0);
    });
  });
});
