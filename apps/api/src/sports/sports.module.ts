import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';
import { SportEntity } from '../entities/sport.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SportEntity])],
  controllers: [SportsController],
  providers: [SportsService],
})
export class SportsModule {}
