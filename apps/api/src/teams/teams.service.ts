import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamEntity } from '../entities/team.entity';
import { TeamMemberEntity } from '../entities/team-member.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsJoinCodeService } from './teams.join-code.service';
import { TeamRole } from '@apex-team/shared/util/models';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(TeamMemberEntity)
    private readonly memberRepo: Repository<TeamMemberEntity>,
    private readonly joinCodeService: TeamsJoinCodeService,
  ) {}

  async findAllByCoach(userId: string): Promise<TeamEntity[]> {
    // Return teams where the user is a member OR the legacy coachId (for safety)
    return this.teamRepo.createQueryBuilder('team')
      .leftJoinAndSelect('team.sport', 'sport')
      .leftJoin('team.members', 'member')
      .where('member.userId = :userId', { userId })
      .orWhere('team.coachId = :userId', { userId })
      .getMany();
  }

  async create(dto: CreateTeamDto, coachId: string): Promise<TeamEntity> {
    const team = this.teamRepo.create({
      name: dto.name,
      sportId: dto.sportId,
      coachId,
      joinCode: this.joinCodeService.generate(),
    });
    
    const savedTeam = await this.teamRepo.save(team);
    
    // Create initial membership
    const member = this.memberRepo.create({
      teamId: savedTeam.id,
      userId: coachId,
      role: TeamRole.HEAD_COACH,
    });
    await this.memberRepo.save(member);
    
    return savedTeam;
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

  async join(userId: string, code: string): Promise<TeamEntity> {
    const team = await this.teamRepo.findOne({
      where: { joinCode: code.toUpperCase() },
      relations: ['sport'],
    });
    
    if (!team) {
      throw new NotFoundException('Invalid join code');
    }

    const existingMember = await this.memberRepo.findOne({
      where: { teamId: team.id, userId },
    });

    if (existingMember) {
      // User is already a member
      return team;
    }

    const member = this.memberRepo.create({
      teamId: team.id,
      userId,
      role: TeamRole.ASSISTANT,
    });
    await this.memberRepo.save(member);

    return team;
  }

  async regenerateCode(teamId: string): Promise<TeamEntity> {
    const team = await this.findOne(teamId);
    
    // Simple retry loop to ensure uniqueness, though 6 chars is plenty for now
    let newCode: string;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      newCode = this.joinCodeService.generate();
      const existing = await this.teamRepo.findOne({ where: { joinCode: newCode } });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new ConflictException('Failed to generate unique join code');
    }

    team.joinCode = newCode!;
    return this.teamRepo.save(team);
  }
}
