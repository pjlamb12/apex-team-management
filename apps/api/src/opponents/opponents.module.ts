import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpponentsController } from './opponents.controller';
import { OpponentsService } from './opponents.service';
import { OpponentEntity } from '../entities/opponent.entity';
import { EventEntity } from '../entities/event.entity';
import { TeamEntity } from '../entities/team.entity';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OpponentEntity, EventEntity, TeamEntity]),
    MembershipsModule,
  ],
  controllers: [OpponentsController],
  providers: [OpponentsService],
  exports: [OpponentsService],
})
export class OpponentsModule {}
