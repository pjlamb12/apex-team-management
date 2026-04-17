import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../entities/player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
  ) {}

  findAllForTeam(teamId: string): Promise<PlayerEntity[]> {
    return this.playerRepo.find({
      where: { teamId },
      order: { jerseyNumber: 'ASC', lastName: 'ASC' },
    });
  }

  async create(teamId: string, data: CreatePlayerDto): Promise<PlayerEntity> {
    const player = this.playerRepo.create({
      ...data,
      teamId,
    });
    return this.playerRepo.save(player);
  }

  async update(teamId: string, playerId: string, data: UpdatePlayerDto): Promise<PlayerEntity> {
    const player = await this.playerRepo.findOne({ where: { id: playerId, teamId } });
    if (!player) throw new NotFoundException(`Player ${playerId} not found in team ${teamId}`);
    Object.assign(player, data);
    return this.playerRepo.save(player);
  }

  async remove(teamId: string, playerId: string): Promise<void> {
    const player = await this.playerRepo.findOne({ where: { id: playerId, teamId } });
    if (!player) throw new NotFoundException(`Player ${playerId} not found in team ${teamId}`);
    await this.playerRepo.remove(player);
  }
}
