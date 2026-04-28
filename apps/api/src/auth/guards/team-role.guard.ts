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

    // Try to find teamId in params, then query, then body
    const teamId = request.params.teamId || request.query.teamId || request.body.teamId;

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
