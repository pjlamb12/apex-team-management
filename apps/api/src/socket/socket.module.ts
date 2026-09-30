import { Module, Global } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Global()
@Module({
  imports: [AuthModule, MembershipsModule],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
