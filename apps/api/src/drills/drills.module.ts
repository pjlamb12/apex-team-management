import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrillEntity } from '../entities/drill.entity';
import { TagEntity } from '../entities/tag.entity';
import { DrillsService } from './drills.service';
import { DrillsController } from './drills.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DrillEntity, TagEntity])],
  providers: [DrillsService],
  controllers: [DrillsController],
  exports: [DrillsService],
})
export class DrillsModule {}
