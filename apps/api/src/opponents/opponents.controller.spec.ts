import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { OpponentsController } from './opponents.controller';
import { OpponentsService } from './opponents.service';
import { MembershipService } from '../memberships/membership.service';

describe('OpponentsController', () => {
  let controller: OpponentsController;
  let opponentsService: any;

  const mockTeamId = 'team-123';
  const mockOpponentId = 'opp-123';

  beforeEach(async () => {
    opponentsService = {
      findAllForTeam: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue({ id: mockOpponentId, name: 'Thunder FC' }),
      create: vi.fn().mockResolvedValue({ id: mockOpponentId, name: 'Thunder FC' }),
      update: vi.fn().mockResolvedValue({ id: mockOpponentId, name: 'Thunder FC Updated' }),
      remove: vi.fn().mockResolvedValue(undefined),
      addScoutingNote: vi.fn().mockResolvedValue({ id: 'note-1', content: 'Good speed' }),
      deleteScoutingNote: vi.fn().mockResolvedValue(undefined),
    };

    const mockMembershipsService = {
      getUserRole: vi.fn().mockResolvedValue('head_coach'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpponentsController],
      providers: [
        { provide: OpponentsService, useValue: opponentsService },
        { provide: MembershipService, useValue: mockMembershipsService },
      ],
    }).compile();

    controller = module.get<OpponentsController>(OpponentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should call service.findAllForTeam', async () => {
    await controller.findAll(mockTeamId, 'thunder', 'high');
    expect(opponentsService.findAllForTeam).toHaveBeenCalledWith(mockTeamId, {
      search: 'thunder',
      threatLevel: 'high',
    });
  });

  it('create should call service.create', async () => {
    const dto = { name: 'Thunder FC' };
    await controller.create(mockTeamId, dto);
    expect(opponentsService.create).toHaveBeenCalledWith(mockTeamId, dto);
  });

  it('findOne should call service.findOne', async () => {
    await controller.findOne(mockTeamId, mockOpponentId);
    expect(opponentsService.findOne).toHaveBeenCalledWith(mockTeamId, mockOpponentId);
  });

  it('update should call service.update', async () => {
    const dto = { name: 'Thunder FC Updated' };
    await controller.update(mockTeamId, mockOpponentId, dto);
    expect(opponentsService.update).toHaveBeenCalledWith(mockTeamId, mockOpponentId, dto);
  });

  it('remove should call service.remove', async () => {
    await controller.remove(mockTeamId, mockOpponentId);
    expect(opponentsService.remove).toHaveBeenCalledWith(mockTeamId, mockOpponentId);
  });

  it('addScoutingNote should pass user display name', async () => {
    const req = { user: { displayName: 'Coach John', email: 'john@coach.com' } };
    const dto = { content: 'Good speed' };
    await controller.addScoutingNote(mockTeamId, mockOpponentId, req, dto);
    expect(opponentsService.addScoutingNote).toHaveBeenCalledWith(
      mockTeamId,
      mockOpponentId,
      'Coach John',
      dto,
    );
  });

  it('deleteScoutingNote should call service.deleteScoutingNote', async () => {
    await controller.deleteScoutingNote(mockTeamId, mockOpponentId, 'note-1');
    expect(opponentsService.deleteScoutingNote).toHaveBeenCalledWith(
      mockTeamId,
      mockOpponentId,
      'note-1',
    );
  });
});
