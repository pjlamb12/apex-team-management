import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerAwardEntity } from '../entities/player-award.entity';
import { PlayerEntity } from '../entities/player.entity';
import { EventEntity } from '../entities/event.entity';
import { AwardsService } from './awards.service';
import { AwardsController } from './awards.controller';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlayerAwardEntity,
      PlayerEntity,
      EventEntity,
    ]),
    MembershipsModule,
  ],
  controllers: [AwardsController],
  providers: [AwardsService],
  exports: [AwardsService],
})
export class AwardsModule {}
