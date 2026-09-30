import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEntity } from '../entities/player.entity';
import { SeasonPlayerEntity } from '../entities/season-player.entity';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayerEntity, SeasonPlayerEntity]),
    MembershipsModule,
  ],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
