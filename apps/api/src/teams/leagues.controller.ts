import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaguesService } from './leagues.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService) {}

  @Post('seasons/:seasonId/leagues')
  create(
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
    @Body() dto: CreateLeagueDto,
  ) {
    return this.leaguesService.create(seasonId, dto);
  }

  @Get('seasons/:seasonId/leagues')
  findAll(@Param('seasonId', ParseUUIDPipe) seasonId: string) {
    return this.leaguesService.findAllForSeason(seasonId);
  }

  @Get('leagues/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaguesService.findOne(id);
  }

  @Patch('leagues/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeagueDto,
  ) {
    return this.leaguesService.update(id, dto);
  }

  @Delete('leagues/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaguesService.remove(id);
  }
}
