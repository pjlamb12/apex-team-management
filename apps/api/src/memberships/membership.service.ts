import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TeamMemberEntity } from '../entities/team-member.entity';
import { SeasonEntity } from '../entities/season.entity';
import { LeagueEntity } from '../entities/league.entity';
import { EventEntity } from '../entities/event.entity';
import { TeamRole } from '@apex-team/shared/util/models';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(TeamMemberEntity)
    private readonly membershipRepo: Repository<TeamMemberEntity>,
    @Optional()
    private readonly dataSource?: DataSource,
  ) {}

  async isMember(userId: string, teamId: string): Promise<boolean> {
    const membership = await this.membershipRepo.findOne({
      where: { userId, teamId },
    });
    return !!membership;
  }

  async getRole(userId: string, teamId: string): Promise<TeamRole | null> {
    const membership = await this.membershipRepo.findOne({
      where: { userId, teamId },
    });
    return membership ? membership.role : null;
  }

  async hasRole(userId: string, teamId: string, roles: TeamRole[]): Promise<boolean> {
    const membership = await this.membershipRepo.findOne({
      where: { userId, teamId },
    });
    
    if (!membership) {
      return false;
    }

    return roles.includes(membership.role);
  }

  async findTeamIdBySeasonId(seasonId: string): Promise<string | null> {
    if (!this.dataSource) return null;
    try {
      const season = await this.dataSource.getRepository(SeasonEntity).findOne({
        where: { id: seasonId },
        select: ['id', 'teamId'],
      });
      return season?.teamId ?? null;
    } catch {
      return null;
    }
  }

  async findTeamIdByLeagueId(leagueId: string): Promise<string | null> {
    if (!this.dataSource) return null;
    try {
      const league = await this.dataSource.getRepository(LeagueEntity).findOne({
        where: { id: leagueId },
        relations: ['season'],
      });
      return league?.season?.teamId ?? null;
    } catch {
      return null;
    }
  }

  async findTeamIdByEventId(eventId: string): Promise<string | null> {
    if (!this.dataSource) return null;
    try {
      const event = await this.dataSource.getRepository(EventEntity).findOne({
        where: { id: eventId },
        relations: ['season'],
      });
      return event?.season?.teamId ?? null;
    } catch {
      return null;
    }
  }
}
