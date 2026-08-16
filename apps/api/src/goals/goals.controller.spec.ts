import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

describe('GoalsController', () => {
  let controller: GoalsController;
  let mockGoalsService: any;

  beforeEach(() => {
    mockGoalsService = {
      findAll: vi.fn().mockResolvedValue([]),
      getSummary: vi.fn().mockResolvedValue({ totalGoals: 0 }),
      findByPlayer: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue({ id: 'goal-1' }),
      create: vi.fn().mockResolvedValue({ id: 'goal-1' }),
      update: vi.fn().mockResolvedValue({ id: 'goal-1' }),
      remove: vi.fn().mockResolvedValue({ success: true, id: 'goal-1' }),
      addNote: vi.fn().mockResolvedValue({ id: 'note-1' }),
      removeNote: vi.fn().mockResolvedValue({ success: true, id: 'note-1' }),
    };

    controller = new GoalsController(mockGoalsService as GoalsService);
  });

  it('should call findAll with query params', async () => {
    await controller.findAll('team-1', 'season-1', 'player-1', 'tactical', 'in_progress');
    expect(mockGoalsService.findAll).toHaveBeenCalledWith('team-1', {
      seasonId: 'season-1',
      playerId: 'player-1',
      category: 'tactical',
      status: 'in_progress',
    });
  });

  it('should call getSummary', async () => {
    await controller.getSummary('team-1', 'season-1');
    expect(mockGoalsService.getSummary).toHaveBeenCalledWith('team-1', 'season-1');
  });

  it('should call findByPlayer', async () => {
    await controller.findByPlayer('team-1', 'player-1', 'season-1');
    expect(mockGoalsService.findByPlayer).toHaveBeenCalledWith('team-1', 'player-1', 'season-1');
  });

  it('should call findOne', async () => {
    await controller.findOne('team-1', 'goal-1');
    expect(mockGoalsService.findOne).toHaveBeenCalledWith('team-1', 'goal-1');
  });

  it('should call create', async () => {
    const dto = {
      playerId: 'player-1',
      title: 'Scanning Before Receiving',
      category: 'tactical' as const,
    };
    await controller.create('team-1', 'player-1', dto);
    expect(mockGoalsService.create).toHaveBeenCalledWith('team-1', 'player-1', dto);
  });

  it('should call update', async () => {
    const dto = {
      masteryStage: 'mastered' as const,
    };
    await controller.update('team-1', 'goal-1', dto);
    expect(mockGoalsService.update).toHaveBeenCalledWith('team-1', 'goal-1', dto);
  });

  it('should call delete', async () => {
    await controller.delete('team-1', 'goal-1');
    expect(mockGoalsService.remove).toHaveBeenCalledWith('team-1', 'goal-1');
  });

  it('should call addNote', async () => {
    const dto = {
      note: 'Great progress in match',
      stage: 'developing' as const,
    };
    await controller.addNote('team-1', 'goal-1', dto);
    expect(mockGoalsService.addNote).toHaveBeenCalledWith('team-1', 'goal-1', dto);
  });

  it('should call deleteNote', async () => {
    await controller.deleteNote('team-1', 'goal-1', 'note-1');
    expect(mockGoalsService.removeNote).toHaveBeenCalledWith('team-1', 'goal-1', 'note-1');
  });
});
