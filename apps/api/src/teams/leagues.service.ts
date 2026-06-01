import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeagueEntity } from '../entities/league.entity';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';

@Injectable()
export class LeaguesService {
  constructor(
    @InjectRepository(LeagueEntity)
    private readonly leagueRepo: Repository<LeagueEntity>,
  ) {}

  async findAllForSeason(seasonId: string): Promise<LeagueEntity[]> {
    return this.leagueRepo.find({
      where: { seasonId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<LeagueEntity> {
    const league = await this.leagueRepo.findOne({ where: { id } });
    if (!league) throw new NotFoundException(`League ${id} not found`);
    return league;
  }

  async create(seasonId: string, dto: CreateLeagueDto): Promise<LeagueEntity> {
    const league = this.leagueRepo.create({ ...dto, seasonId });
    return this.leagueRepo.save(league);
  }

  async update(id: string, dto: UpdateLeagueDto): Promise<LeagueEntity> {
    const league = await this.findOne(id);
    Object.assign(league, dto);
    return this.leagueRepo.save(league);
  }

  async remove(id: string): Promise<void> {
    const league = await this.findOne(id);
    await this.leagueRepo.remove(league);
  }
}
