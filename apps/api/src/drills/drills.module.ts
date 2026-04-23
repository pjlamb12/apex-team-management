import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrillEntity } from '../entities/drill.entity';
import { TagEntity } from '../entities/tag.entity';
import { PracticeDrillEntity } from '../entities/practice-drill.entity';
import { EventEntity } from '../entities/event.entity';
import { DrillsService } from './drills.service';
import { PracticeDrillsService } from './practice-drills.service';
import { DrillsController } from './drills.controller';
import { PracticeDrillsController } from './practice-drills.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DrillEntity,
      TagEntity,
      PracticeDrillEntity,
      EventEntity,
    ]),
  ],
  providers: [DrillsService, PracticeDrillsService],
  controllers: [DrillsController, PracticeDrillsController],
  exports: [DrillsService, PracticeDrillsService],
})
export class DrillsModule {}
