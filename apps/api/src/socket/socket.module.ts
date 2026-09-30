import { Module, Global } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MembershipsModule } from '../memberships/memberships.module';

@Global()
@Module({
  imports: [MembershipsModule],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
