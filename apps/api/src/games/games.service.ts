import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameEntity } from '../entities/game.entity';
import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(SeasonEntity)
    private readonly seasonRepo: Repository<SeasonEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
  ) {}

  async create(teamId: string, dto: CreateGameDto, userId?: string): Promise<GameEntity> {
    // Optional ownership check if userId is provided
    if (userId) {
      const team = await this.teamRepo.findOne({ where: { id: teamId } });
      if (!team) throw new NotFoundException(`Team ${teamId} not found`);
      if (team.coachId !== userId) {
        throw new ForbiddenException('Not authorized to create games for this team');
      }
    }

    // 1. Check for an active season on the team.
    let activeSeason = await this.seasonRepo.findOne({
      where: { teamId, isActive: true },
    });

    // 2. If no active season exists, create one named "YYYY Season".
    if (!activeSeason) {
      const year = new Date().getFullYear();
      activeSeason = this.seasonRepo.create({
        teamId,
        name: `${year} Season`,
        isActive: true,
      });
      activeSeason = await this.seasonRepo.save(activeSeason);
    }

    // 3. Create the game with the seasonId.
    const game = this.gameRepo.create({
      ...dto,
      seasonId: activeSeason.id,
      status: 'scheduled',
    });

    // 4. Save the game.
    return this.gameRepo.save(game);
  }

  async findAllForTeam(teamId: string): Promise<GameEntity[]> {
    // Find the active season for the team.
    const activeSeason = await this.seasonRepo.findOne({
      where: { teamId, isActive: true },
    });

    // If none, return empty array.
    if (!activeSeason) {
      return [];
    }

    // Find all games for that season.
    return this.gameRepo.find({
      where: { seasonId: activeSeason.id },
      order: { scheduledAt: 'ASC' },
    });
  }

  async findOne(gameId: string): Promise<GameEntity> {
    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }
    return game;
  }

  async update(gameId: string, dto: UpdateGameDto): Promise<GameEntity> {
    const game = await this.findOne(gameId);
    Object.assign(game, dto);
    return this.gameRepo.save(game);
  }

  async remove(gameId: string): Promise<void> {
    const game = await this.findOne(gameId);
    await this.gameRepo.remove(game);
  }
}
