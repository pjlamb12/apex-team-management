import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../entities/player.entity';
import { SeasonPlayerEntity } from '../entities/season-player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(SeasonPlayerEntity)
    private readonly seasonPlayerRepo: Repository<SeasonPlayerEntity>,
  ) {}

  findAllForTeam(teamId: string, includeInactive = false): Promise<PlayerEntity[]> {
    const where: any = { teamId, isGuest: false };
    if (!includeInactive) {
      where.isActive = true;
    }
    return this.playerRepo.find({
      where,
      order: { jerseyNumber: 'ASC', lastName: 'ASC' },
    });
  }

  async findAllForSeason(seasonId: string, includeInactive = false): Promise<PlayerEntity[]> {
    const playerWhere: any = { isGuest: false };
    if (!includeInactive) {
      playerWhere.isActive = true;
    }
    const seasonPlayers = await this.seasonPlayerRepo.find({
      where: { seasonId, player: playerWhere },
      relations: ['player'],
    });
    return seasonPlayers
      .map(sp => sp.player)
      .filter(Boolean)
      .sort((a, b) => (a.jerseyNumber ?? Infinity) - (b.jerseyNumber ?? Infinity));
  }

  async findAllForLeague(leagueId: string): Promise<PlayerEntity[]> {
    return this.playerRepo.find({
      where: { leagueId, isGuest: true, isActive: true },
      order: { jerseyNumber: 'ASC', lastName: 'ASC' },
    });
  }

  async create(teamId: string, data: CreatePlayerDto & { seasonId?: string; leagueId?: string }): Promise<PlayerEntity> {
    const isGuest = data.leagueId ? true : (data.isGuest ?? false);
    const isActive = data.isActive ?? true;
    const player = this.playerRepo.create({ 
      firstName: data.firstName,
      lastName: data.lastName,
      jerseyNumber: data.jerseyNumber,
      parentEmail: data.parentEmail,
      preferredPosition: data.preferredPosition,
      isGuest,
      isActive,
      leagueId: data.leagueId ?? null,
      teamId 
    });
    const savedPlayer = await this.playerRepo.save(player);

    if (data.seasonId && !isGuest) {
      await this.addPlayerToSeason(data.seasonId, savedPlayer.id);
    }

    return savedPlayer;
  }

  async addPlayerToSeason(seasonId: string, playerId: string): Promise<SeasonPlayerEntity> {
    const existing = await this.seasonPlayerRepo.findOne({ where: { seasonId, playerId } });
    if (existing) return existing;

    const sp = this.seasonPlayerRepo.create({ seasonId, playerId });
    return this.seasonPlayerRepo.save(sp);
  }

  async removePlayerFromSeason(seasonId: string, playerId: string): Promise<void> {
    await this.seasonPlayerRepo.delete({ seasonId, playerId });
  }

  async update(teamId: string, playerId: string, data: UpdatePlayerDto): Promise<PlayerEntity> {
    const player = await this.playerRepo.findOne({ where: { id: playerId, teamId } });
    if (!player) throw new NotFoundException(`Player ${playerId} not found`);
    Object.assign(player, data);
    return this.playerRepo.save(player);
  }

  async remove(teamId: string, playerId: string): Promise<void> {
    const player = await this.playerRepo.findOne({ where: { id: playerId, teamId } });
    if (!player) throw new NotFoundException(`Player ${playerId} not found`);
    await this.playerRepo.remove(player);
  }
}
