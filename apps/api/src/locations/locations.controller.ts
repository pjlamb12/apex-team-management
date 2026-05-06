import { Controller, Get, Post, Body, Query, UseGuards, Param, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocationsService } from './locations.service';
import { GeocodedLocation } from './geocoding.service';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller('teams/:teamId/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findAll(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.locationsService.findAll(teamId);
  }

  @Get('search')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  search(@Query('q') query: string) {
    return this.locationsService.search(query);
  }

  @Post()
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() data: GeocodedLocation & { address?: string }
  ) {
    return this.locationsService.createFromGeocoded(teamId, data);
  }

  @Post('manual')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  createManual(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() data: any
  ) {
    return this.locationsService.createManual(teamId, data);
  }
}
