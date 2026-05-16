import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateEntity } from '../entities/candidate.entity';
import { CandidateAttendanceEntity } from '../entities/candidate-attendance.entity';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { PlayersModule } from '../players/players.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateEntity, CandidateAttendanceEntity]),
    PlayersModule,
  ],
  providers: [CandidatesService],
  controllers: [CandidatesController],
  exports: [CandidatesService],
})
export class CandidatesModule {}
