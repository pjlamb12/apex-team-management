import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TacticsController } from './tactics.controller';
import { TacticsService } from './tactics.service';

describe('TacticsController', () => {
  let controller: TacticsController;
  let service: TacticsService;

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      seedPresets: vi.fn(),
    } as any;

    controller = new TacticsController(service);
  });

  it('should call findAll with user id and filters', async () => {
    await controller.findAll({ user: { sub: 'coach-1' } }, 'soccer', 'formation', '4-3-3');
    expect(service.findAll).toHaveBeenCalledWith('coach-1', 'soccer', 'formation', '4-3-3');
  });

  it('should call create with user id and dto', async () => {
    const dto: any = { title: '4-3-3', sport: 'soccer' };
    await controller.create({ user: { sub: 'coach-1' } }, dto);
    expect(service.create).toHaveBeenCalledWith('coach-1', dto);
  });

  it('should call seedPresets with user id and sport', async () => {
    await controller.seedPresets({ user: { sub: 'coach-1' } }, 'soccer');
    expect(service.seedPresets).toHaveBeenCalledWith('coach-1', 'soccer');
  });

  it('should call findOne with id and user id', async () => {
    await controller.findOne('play-1', { user: { sub: 'coach-1' } });
    expect(service.findOne).toHaveBeenCalledWith('play-1', 'coach-1');
  });

  it('should call update with id, user id, and dto', async () => {
    const dto: any = { title: 'Updated' };
    await controller.update('play-1', { user: { sub: 'coach-1' } }, dto);
    expect(service.update).toHaveBeenCalledWith('play-1', 'coach-1', dto);
  });

  it('should call remove with id and user id', async () => {
    await controller.remove('play-1', { user: { sub: 'coach-1' } });
    expect(service.remove).toHaveBeenCalledWith('play-1', 'coach-1');
  });
});
