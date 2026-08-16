import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TacticPlayEntity } from '../entities/tactic-play.entity';
import { TacticsService } from './tactics.service';
import { TacticsController } from './tactics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TacticPlayEntity])],
  providers: [TacticsService],
  controllers: [TacticsController],
  exports: [TacticsService],
})
export class TacticsModule {}
