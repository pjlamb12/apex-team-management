import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { TeamRoleGuard } from './team-role.guard';
import { MembershipService } from '../../memberships/membership.service';
import { TEAM_ROLE_KEY } from '../decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TeamRoleGuard', () => {
  let guard: TeamRoleGuard;
  let reflector: Reflector;
  let membershipService: MembershipService;

  const mockMembershipService = {
    hasRole: vi.fn(),
  };

  const mockReflector = {
    getAllAndOverride: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamRoleGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: MembershipService, useValue: mockMembershipService },
      ],
    }).compile();

    guard = module.get<TeamRoleGuard>(TeamRoleGuard);
    reflector = module.get<Reflector>(Reflector);
    membershipService = module.get<MembershipService>(MembershipService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no roles are required', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(null);
    const context = createMockContext({}, {});
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should return false if no user is present', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([TeamRole.HEAD_COACH]);
    const context = createMockContext(null, { teamId: 'team1' });
    const result = await guard.canActivate(context);
    expect(result).toBe(false);
  });

  it('should throw ForbiddenException if teamId is missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([TeamRole.HEAD_COACH]);
    const context = createMockContext({ sub: 'user1' }, {});
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should return true if user has required role', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([TeamRole.HEAD_COACH]);
    mockMembershipService.hasRole.mockResolvedValue(true);
    const context = createMockContext({ sub: 'user1' }, { teamId: 'team1' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockMembershipService.hasRole).toHaveBeenCalledWith('user1', 'team1', [TeamRole.HEAD_COACH]);
  });

  it('should throw ForbiddenException if user does not have required role', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([TeamRole.HEAD_COACH]);
    mockMembershipService.hasRole.mockResolvedValue(false);
    const context = createMockContext({ sub: 'user1' }, { teamId: 'team1' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  function createMockContext(user: any, params: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          query: {},
          body: {},
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }
});
