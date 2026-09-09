import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { MembershipService } from '../memberships/membership.service';
import { TeamRole } from '@apex-team/shared/util/models';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly membershipService: MembershipService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        this.logger.warn(`Client connection without token: ${client.id}`);
        client.disconnect();
        return;
      }
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
    } catch {
      this.logger.warn(`Client connection unauthorized: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTeam')
  async handleJoinTeam(@MessageBody() teamId: string, @ConnectedSocket() client: Socket) {
    if (!teamId) {
      return { error: 'Invalid team ID' };
    }

    const userId = client.data?.user?.sub || client.data?.user?.id;
    if (!userId) {
      this.logger.warn(`Client ${client.id} missing user data attempting joinTeam`);
      return { error: 'Unauthorized' };
    }

    const hasAccess = await this.membershipService.hasRole(userId, teamId, [
      TeamRole.HEAD_COACH,
      TeamRole.ASSISTANT,
    ]);

    if (!hasAccess) {
      this.logger.warn(`Client ${client.id} (User: ${userId}) unauthorized for team:${teamId}`);
      return { error: 'Forbidden' };
    }

    client.join(`team:${teamId}`);
    this.logger.log(`Client ${client.id} joined room team:${teamId}`);
    return { status: 'joined', room: `team:${teamId}` };
  }

  @SubscribeMessage('leaveTeam')
  handleLeaveTeam(@MessageBody() teamId: string, @ConnectedSocket() client: Socket) {
    client.leave(`team:${teamId}`);
    this.logger.log(`Client ${client.id} left room team:${teamId}`);
    return { status: 'left', room: `team:${teamId}` };
  }

  @SubscribeMessage('joinEvent')
  async handleJoinEvent(@MessageBody() eventId: string, @ConnectedSocket() client: Socket) {
    if (!eventId) {
      return { error: 'Invalid event ID' };
    }

    const userId = client.data?.user?.sub || client.data?.user?.id;
    if (!userId) {
      this.logger.warn(`Client ${client.id} missing user data attempting joinEvent`);
      return { error: 'Unauthorized' };
    }

    const teamId = await this.membershipService.findTeamIdByEventId(eventId);
    if (!teamId) {
      this.logger.warn(`Client ${client.id} event not found or no team: ${eventId}`);
      return { error: 'Event not found' };
    }

    const hasAccess = await this.membershipService.hasRole(userId, teamId, [
      TeamRole.HEAD_COACH,
      TeamRole.ASSISTANT,
    ]);

    if (!hasAccess) {
      this.logger.warn(`Client ${client.id} (User: ${userId}) unauthorized for event:${eventId}`);
      return { error: 'Forbidden' };
    }

    client.join(`event:${eventId}`);
    this.logger.log(`Client ${client.id} joined room event:${eventId}`);
    return { status: 'joined', room: `event:${eventId}` };
  }

  @SubscribeMessage('leaveEvent')
  handleLeaveEvent(@MessageBody() eventId: string, @ConnectedSocket() client: Socket) {
    client.leave(`event:${eventId}`);
    this.logger.log(`Client ${client.id} left room event:${eventId}`);
    return { status: 'left', room: `event:${eventId}` };
  }
}
