import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerGoalEntity } from '../entities/player-goal.entity';
import { PlayerGoalNoteEntity } from '../entities/player-goal-note.entity';
import { PlayerEntity } from '../entities/player.entity';
import { EventEntity } from '../entities/event.entity';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlayerGoalEntity,
      PlayerGoalNoteEntity,
      PlayerEntity,
      EventEntity,
    ]),
    MembershipsModule,
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
