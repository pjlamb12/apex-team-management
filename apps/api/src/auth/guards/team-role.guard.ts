import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipService } from '../../memberships/membership.service';
import { TEAM_ROLE_KEY } from '../decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@Injectable()
export class TeamRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private membershipService: MembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<TeamRole[]>(TEAM_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.sub) {
      return false;
    }

    // Try to find teamId in params, then query, then body, then related entities
    let teamId = request.params.teamId || request.query.teamId || request.body.teamId;

    if (!teamId && request.params.seasonId) {
      teamId = await this.membershipService.findTeamIdBySeasonId(request.params.seasonId);
    }

    if (!teamId && request.params.leagueId) {
      teamId = await this.membershipService.findTeamIdByLeagueId(request.params.leagueId);
    }

    if (!teamId && request.params.id) {
      const path = request.route?.path || request.raw?.url || request.url || '';
      if (path.includes('seasons') && !path.includes('teams')) {
        teamId = await this.membershipService.findTeamIdBySeasonId(request.params.id);
      } else if (path.includes('leagues') && !path.includes('teams')) {
        teamId = await this.membershipService.findTeamIdByLeagueId(request.params.id);
      } else {
        teamId = request.params.id;
      }
    }

    if (!teamId) {
      // If we need a role but don't have a teamId, we can't verify
      throw new ForbiddenException('Team context missing');
    }

    const hasRole = await this.membershipService.hasRole(user.sub, teamId, requiredRoles);
    
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions for this team');
    }

    return true;
  }
}
