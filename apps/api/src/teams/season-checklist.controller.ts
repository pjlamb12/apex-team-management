import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SeasonChecklistService } from './season-checklist.service';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller('seasons/:seasonId/checklist')
export class SeasonChecklistController {
  constructor(private readonly checklistService: SeasonChecklistService) {}

  @Get('items')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findItems(@Param('seasonId', ParseUUIDPipe) seasonId: string) {
    return this.checklistService.findItems(seasonId);
  }

  @Post('items')
  @TeamRoles(TeamRole.HEAD_COACH)
  createItem(
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
    @Body('name') name: string,
  ) {
    return this.checklistService.createItem(seasonId, name);
  }

  @Delete('items/:itemId')
  @TeamRoles(TeamRole.HEAD_COACH)
  removeItem(
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.checklistService.removeItem(itemId);
  }

  @Get('values')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findValues(@Param('seasonId', ParseUUIDPipe) seasonId: string) {
    return this.checklistService.findValues(seasonId);
  }

  @Post('values')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  upsertValue(
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
    @Body('playerId') playerId: string,
    @Body('itemId') itemId: string,
    @Body('value') value: string | null,
  ) {
    return this.checklistService.upsertValue(playerId, itemId, value);
  }
}
