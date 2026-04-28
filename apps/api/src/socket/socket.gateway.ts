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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(private readonly jwtService: JwtService) {}

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
    } catch (e) {
      this.logger.warn(`Client connection unauthorized: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTeam')
  handleJoinTeam(@MessageBody() teamId: string, @ConnectedSocket() client: Socket) {
    client.join(`team:${teamId}`);
    this.logger.log(`Client ${client.id} joined room team:${teamId}`);
  }

  @SubscribeMessage('leaveTeam')
  handleLeaveTeam(@MessageBody() teamId: string, @ConnectedSocket() client: Socket) {
    client.leave(`team:${teamId}`);
    this.logger.log(`Client ${client.id} left room team:${teamId}`);
  }

  @SubscribeMessage('joinEvent')
  handleJoinEvent(@MessageBody() eventId: string, @ConnectedSocket() client: Socket) {
    client.join(`event:${eventId}`);
    this.logger.log(`Client ${client.id} joined room event:${eventId}`);
  }

  @SubscribeMessage('leaveEvent')
  handleLeaveEvent(@MessageBody() eventId: string, @ConnectedSocket() client: Socket) {
    client.leave(`event:${eventId}`);
    this.logger.log(`Client ${client.id} left room event:${eventId}`);
  }
}
