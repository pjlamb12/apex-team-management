import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceEntity } from '../entities/attendance.entity';
import { EventEntity } from '../entities/event.entity';
import { PlayerEntity } from '../entities/player.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceEntity,
      EventEntity,
      PlayerEntity,
      LineupEntryEntity,
    ]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
