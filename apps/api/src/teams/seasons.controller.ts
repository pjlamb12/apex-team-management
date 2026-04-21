import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Post('teams/:teamId/seasons')
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: CreateSeasonDto,
  ) {
    return this.seasonsService.create({ ...dto, teamId });
  }

  @Get('teams/:teamId/seasons')
  findAll(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.seasonsService.findAllForTeam(teamId);
  }

  @Get('seasons/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.seasonsService.findOne(id);
  }

  @Patch('seasons/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSeasonDto,
  ) {
    return this.seasonsService.update(id, dto);
  }

  @Delete('seasons/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.seasonsService.remove(id);
  }

  @Get('teams/:teamId/seasons/active')
  findActive(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.seasonsService.findActiveForTeam(teamId);
  }

  @Get('teams/:teamId/seasons/:seasonId/stats')
  getStats(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
  ) {
    return this.seasonsService.getSeasonStats(teamId, seasonId);
  }
}
