import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamEntity } from '../entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
  ) {}

  findAllByCoach(coachId: string): Promise<TeamEntity[]> {
    return this.teamRepo.find({
      where: { coachId },
      relations: ['sport'],
    });
  }

  async create(dto: CreateTeamDto, coachId: string): Promise<TeamEntity> {
    const team = this.teamRepo.create({
      name: dto.name,
      sportId: dto.sportId,
      coachId,
    });
    return this.teamRepo.save(team);
  }

  async findOne(id: string): Promise<TeamEntity> {
    const team = await this.teamRepo.findOne({
      where: { id },
      relations: ['sport'],
    });
    if (!team) throw new NotFoundException(`Team ${id} not found`);
    return team;
  }

  async update(id: string, dto: UpdateTeamDto): Promise<TeamEntity> {
    const team = await this.findOne(id);
    Object.assign(team, dto);
    return this.teamRepo.save(team);
  }

  async remove(id: string): Promise<void> {
    const team = await this.findOne(id);
    await this.teamRepo.remove(team);
  }
}
