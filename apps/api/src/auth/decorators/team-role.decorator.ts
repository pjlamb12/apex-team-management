import { SetMetadata } from '@nestjs/common';
import { TeamRole } from '@apex-team/shared/util/models';

export const TEAM_ROLE_KEY = 'team_roles';
export const TeamRoles = (...roles: TeamRole[]) => SetMetadata(TEAM_ROLE_KEY, roles);
