import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMemberEntity } from '../entities/team-member.entity';
import { TeamRole } from '@apex-team/shared/util/models';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(TeamMemberEntity)
    private readonly membershipRepo: Repository<TeamMemberEntity>
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
}
