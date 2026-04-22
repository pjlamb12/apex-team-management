import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual } from 'typeorm';
import { SeasonEntity } from '../entities/season.entity';
import { EventEntity } from '../entities/event.entity';
import { GameEventEntity } from '../entities/game-event.entity';
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

    // Fetch all games for the season to calculate aggregate stats
    const games = await this.dataSource.getRepository(EventEntity).find({
      where: { seasonId: seasonId, type: 'game' },
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
      let gFor = game.goalsFor;
      let gAgainst = game.goalsAgainst;

      // If manual scores are not set, try to derive them from the event logs
      if (gFor === null || gAgainst === null) {
        const counts = await this.dataSource.getRepository(GameEventEntity).find({
          where: { eventId: game.id },
        });

        const logFor = counts.filter(e => e.eventType === 'GOAL').length;
        const logAgainst = counts.filter(e => e.eventType === 'OPPONENT_GOAL').length;

        // Only use logs if there is actually data there, otherwise skip "empty" scheduled games
        if (gFor === null && (logFor > 0 || logAgainst > 0 || game.status === 'completed')) {
          gFor = logFor;
        }
        if (gAgainst === null && (logFor > 0 || logAgainst > 0 || game.status === 'completed')) {
          gAgainst = logAgainst;
        }
      }

      // If we still have no score data, skip this game (e.g. it is in the future)
      if (gFor === null || gAgainst === null) {
        continue;
      }

      stats.goalsFor += gFor;
      stats.goalsAgainst += gAgainst;

      if (gFor > gAgainst) {
        stats.wins++;
      } else if (gFor < gAgainst) {
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
