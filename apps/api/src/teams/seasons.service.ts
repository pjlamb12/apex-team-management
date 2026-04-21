import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SeasonEntity } from '../entities/season.entity';
import { EventEntity } from '../entities/event.entity';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { SeasonStats } from './dto/season-stats.dto';

@Injectable()
export class SeasonsService {
  constructor(
    @InjectRepository(SeasonEntity)
    private readonly seasonRepo: Repository<SeasonEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getSeasonStats(teamId: string, seasonId: string): Promise<SeasonStats> {
    const season = await this.seasonRepo.findOne({
      where: { id: seasonId, teamId },
    });
    if (!season) {
      throw new NotFoundException(
        `Season ${seasonId} not found for team ${teamId}`,
      );
    }

    const games = await this.dataSource.getRepository(EventEntity).find({
      where: { seasonId: seasonId, type: 'game', status: 'completed' },
    });

    const stats: SeasonStats = {
      wins: 0,
      losses: 0,
      draws: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    };

    for (const game of games) {
      if (game.goalsFor === null || game.goalsAgainst === null) {
        continue;
      }

      stats.goalsFor += game.goalsFor;
      stats.goalsAgainst += game.goalsAgainst;

      if (game.goalsFor > game.goalsAgainst) {
        stats.wins++;
      } else if (game.goalsFor < game.goalsAgainst) {
        stats.losses++;
      } else {
        stats.draws++;
      }
    }

    stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
    return stats;
  }

  async create(dto: CreateSeasonDto): Promise<SeasonEntity> {
    return this.dataSource.transaction(async (manager) => {
      const season = manager.create(SeasonEntity, dto);
      
      if (dto.isActive) {
        await manager.update(
          SeasonEntity,
          { teamId: dto.teamId },
          { isActive: false },
        );
      }
      
      return manager.save(season);
    });
  }

  async findAllForTeam(teamId: string): Promise<SeasonEntity[]> {
    return this.seasonRepo.find({
      where: { teamId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<SeasonEntity> {
    const season = await this.seasonRepo.findOne({ where: { id } });
    if (!season) throw new NotFoundException(`Season ${id} not found`);
    return season;
  }

  async update(id: string, dto: UpdateSeasonDto): Promise<SeasonEntity> {
    return this.dataSource.transaction(async (manager) => {
      const season = await manager.findOne(SeasonEntity, { where: { id } });
      if (!season) throw new NotFoundException(`Season ${id} not found`);

      if (dto.isActive) {
        await manager.update(
          SeasonEntity,
          { teamId: season.teamId },
          { isActive: false },
        );
      }

      Object.assign(season, dto);
      return manager.save(season);
    });
  }

  async remove(id: string): Promise<void> {
    const season = await this.findOne(id);

    const eventsCount = await this.dataSource.getRepository(EventEntity).count({
      where: { seasonId: id },
    });

    if (eventsCount > 0) {
      throw new ConflictException(
        `Cannot delete season ${id} because it has associated events.`,
      );
    }

    await this.seasonRepo.remove(season);
  }

  async findActiveForTeam(teamId: string): Promise<SeasonEntity | null> {
    return this.seasonRepo.findOne({
      where: { teamId, isActive: true },
    });
  }
}
