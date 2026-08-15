import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AwardsController } from './awards.controller';
import { AwardsService } from './awards.service';

describe('AwardsController', () => {
  let controller: AwardsController;
  let mockAwardsService: any;

  beforeEach(() => {
    mockAwardsService = {
      findAll: vi.fn().mockResolvedValue([]),
      getSummary: vi.fn().mockResolvedValue({ totalAwards: 0 }),
      findByPlayer: vi.fn().mockResolvedValue([]),
      findByEvent: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'award-1' }),
      createBatch: vi.fn().mockResolvedValue([{ id: 'award-1' }]),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    controller = new AwardsController(mockAwardsService as AwardsService);
  });

  it('should call findAll with query params', async () => {
    await controller.findAll('team-1', 'season-1', 'player-1', 'event-1', 'mvp');
    expect(mockAwardsService.findAll).toHaveBeenCalledWith('team-1', {
      seasonId: 'season-1',
      playerId: 'player-1',
      eventId: 'event-1',
      category: 'mvp',
    });
  });

  it('should call getSummary', async () => {
    await controller.getSummary('team-1', 'season-1');
    expect(mockAwardsService.getSummary).toHaveBeenCalledWith('team-1', 'season-1');
  });

  it('should call findByPlayer', async () => {
    await controller.findByPlayer('team-1', 'player-1');
    expect(mockAwardsService.findByPlayer).toHaveBeenCalledWith('team-1', 'player-1');
  });

  it('should call findByEvent', async () => {
    await controller.findByEvent('team-1', 'event-1');
    expect(mockAwardsService.findByEvent).toHaveBeenCalledWith('team-1', 'event-1');
  });

  it('should call create', async () => {
    const dto = {
      playerId: 'player-1',
      badgeType: 'player_of_the_match',
      title: 'Player of the Match',
      category: 'mvp' as const,
      icon: 'star-outline',
      color: 'amber',
    };
    await controller.create('team-1', dto);
    expect(mockAwardsService.create).toHaveBeenCalledWith('team-1', dto);
  });

  it('should call createBatch', async () => {
    const body = {
      awards: [
        {
          playerId: 'player-1',
          badgeType: 'player_of_the_match',
          title: 'Player of the Match',
          category: 'mvp' as const,
          icon: 'star-outline',
          color: 'amber',
        },
      ],
    };
    await controller.createBatch('team-1', body);
    expect(mockAwardsService.createBatch).toHaveBeenCalledWith('team-1', body.awards);
  });

  it('should call delete', async () => {
    await controller.delete('team-1', 'award-1');
    expect(mockAwardsService.delete).toHaveBeenCalledWith('team-1', 'award-1');
  });
});
