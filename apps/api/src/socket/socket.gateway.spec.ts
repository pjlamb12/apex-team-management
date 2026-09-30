import { Test, TestingModule } from '@nestjs/testing';
import { SocketGateway } from './socket.gateway';
import { JwtService } from '@nestjs/jwt';
import { MembershipService } from '../memberships/membership.service';
import { TeamRole } from '@apex-team/shared/util/models';
import { Socket } from 'socket.io';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SocketGateway', () => {
  let gateway: SocketGateway;

  const mockJwtService = {
    verifyAsync: vi.fn(),
  };

  const mockMembershipService = {
    hasRole: vi.fn(),
    findTeamIdByEventId: vi.fn(),
  };

  const createMockSocket = (overrides: Record<string, unknown> = {}): Socket => {
    return {
      id: 'sock-123',
      handshake: {
        auth: {},
        headers: {},
      },
      data: {},
      join: vi.fn(),
      leave: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      ...overrides,
    } as unknown as Socket;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MembershipService,
          useValue: mockMembershipService,
        },
      ],
    }).compile();

    gateway = module.get<SocketGateway>(SocketGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate client with token in auth payload', async () => {
      const client = createMockSocket({
        handshake: { auth: { token: 'valid-token' }, headers: {} },
      });
      mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-1', email: 'coach@test.com' });

      await gateway.handleConnection(client);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(client.data.user).toEqual({ sub: 'user-1', email: 'coach@test.com' });
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('should authenticate client with Bearer token in headers', async () => {
      const client = createMockSocket({
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
        },
      });
      mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-2', email: 'assistant@test.com' });

      await gateway.handleConnection(client);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('header-token');
      expect(client.data.user).toEqual({ sub: 'user-2', email: 'assistant@test.com' });
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect client if no token provided', async () => {
      const client = createMockSocket();

      await gateway.handleConnection(client);

      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should disconnect client if token verification fails', async () => {
      const client = createMockSocket({
        handshake: { auth: { token: 'invalid-token' }, headers: {} },
      });
      mockJwtService.verifyAsync.mockRejectedValueOnce(new Error('Invalid token'));

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection without error', () => {
      const client = createMockSocket();
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  describe('handleJoinTeam', () => {
    it('should reject if teamId is not provided', async () => {
      const client = createMockSocket({ data: { user: { sub: 'user-1' } } });

      const result = await gateway.handleJoinTeam('', client);

      expect(result).toEqual({ error: 'Invalid team ID' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should reject if client has no authenticated user data', async () => {
      const client = createMockSocket({ data: {} });

      const result = await gateway.handleJoinTeam('team-1', client);

      expect(result).toEqual({ error: 'Unauthorized' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should reject if user does not have Head Coach or Assistant role on the team', async () => {
      const client = createMockSocket({ data: { user: { sub: 'user-1' } } });
      mockMembershipService.hasRole.mockResolvedValueOnce(false);

      const result = await gateway.handleJoinTeam('team-1', client);

      expect(mockMembershipService.hasRole).toHaveBeenCalledWith('user-1', 'team-1', [
        TeamRole.HEAD_COACH,
        TeamRole.ASSISTANT,
      ]);
      expect(result).toEqual({ error: 'Forbidden' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should allow user to join room if authorized', async () => {
      const client = createMockSocket({ data: { user: { sub: 'user-1' } } });
      mockMembershipService.hasRole.mockResolvedValueOnce(true);

      const result = await gateway.handleJoinTeam('team-1', client);

      expect(mockMembershipService.hasRole).toHaveBeenCalledWith('user-1', 'team-1', [
        TeamRole.HEAD_COACH,
        TeamRole.ASSISTANT,
      ]);
      expect(client.join).toHaveBeenCalledWith('team:team-1');
      expect(result).toEqual({ status: 'joined', room: 'team:team-1' });
    });
  });

  describe('handleLeaveTeam', () => {
    it('should leave team room', () => {
      const client = createMockSocket();

      const result = gateway.handleLeaveTeam('team-1', client);

      expect(client.leave).toHaveBeenCalledWith('team:team-1');
      expect(result).toEqual({ status: 'left', room: 'team:team-1' });
    });
  });

  describe('handleJoinEvent', () => {
    it('should reject if eventId is not provided', async () => {
      const client = createMockSocket({ data: { user: { sub: 'user-1' } } });

      const result = await gateway.handleJoinEvent('', client);

      expect(result).toEqual({ error: 'Invalid event ID' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should reject if client has no authenticated user data', async () => {
      const client = createMockSocket({ data: {} });

      const result = await gateway.handleJoinEvent('event-1', client);

      expect(result).toEqual({ error: 'Unauthorized' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should reject if event has no associated team', async () => {
      const client = createMockSocket({ data: { user: { sub: 'user-1' } } });
      mockMembershipService.findTeamIdByEventId.mockResolvedValueOnce(null);

      const result = await gateway.handleJoinEvent('event-unknown', client);

      expect(mockMembershipService.findTeamIdByEventId).toHaveBeenCalledWith('event-unknown');
      expect(result).toEqual({ error: 'Event not found' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should reject if user is not coach/assistant of the event team', async () => {
      const client = createMockSocket({ data: { user: { sub: 'user-1' } } });
      mockMembershipService.findTeamIdByEventId.mockResolvedValueOnce('team-event-1');
      mockMembershipService.hasRole.mockResolvedValueOnce(false);

      const result = await gateway.handleJoinEvent('event-1', client);

      expect(mockMembershipService.findTeamIdByEventId).toHaveBeenCalledWith('event-1');
      expect(mockMembershipService.hasRole).toHaveBeenCalledWith('user-1', 'team-event-1', [
        TeamRole.HEAD_COACH,
        TeamRole.ASSISTANT,
      ]);
      expect(result).toEqual({ error: 'Forbidden' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should allow user to join event room if authorized', async () => {
      const client = createMockSocket({ data: { user: { sub: 'user-1' } } });
      mockMembershipService.findTeamIdByEventId.mockResolvedValueOnce('team-event-1');
      mockMembershipService.hasRole.mockResolvedValueOnce(true);

      const result = await gateway.handleJoinEvent('event-1', client);

      expect(mockMembershipService.findTeamIdByEventId).toHaveBeenCalledWith('event-1');
      expect(mockMembershipService.hasRole).toHaveBeenCalledWith('user-1', 'team-event-1', [
        TeamRole.HEAD_COACH,
        TeamRole.ASSISTANT,
      ]);
      expect(client.join).toHaveBeenCalledWith('event:event-1');
      expect(result).toEqual({ status: 'joined', room: 'event:event-1' });
    });
  });

  describe('handleLeaveEvent', () => {
    it('should leave event room', () => {
      const client = createMockSocket();

      const result = gateway.handleLeaveEvent('event-1', client);

      expect(client.leave).toHaveBeenCalledWith('event:event-1');
      expect(result).toEqual({ status: 'left', room: 'event:event-1' });
    });
  });
});
