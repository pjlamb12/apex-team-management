import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SportEntity } from '../entities/sport.entity';

@Injectable()
export class SportsService {
  constructor(
    @InjectRepository(SportEntity)
    private readonly sportRepo: Repository<SportEntity>,
  ) {}

  findAllEnabled(): Promise<SportEntity[]> {
    return this.sportRepo.find({ where: { isEnabled: true } });
  }
}
