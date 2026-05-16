import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoutingRubricEntity } from '../entities/scouting-rubric.entity';
import { CandidateEvaluationEntity } from '../entities/candidate-evaluation.entity';
import { ScoutingService } from './scouting.service';
import { ScoutingController } from './scouting.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScoutingRubricEntity, CandidateEvaluationEntity]),
  ],
  providers: [ScoutingService],
  controllers: [ScoutingController],
  exports: [ScoutingService],
})
export class ScoutingModule {}
