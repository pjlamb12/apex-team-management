import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GamesService } from './games.service';
import { LineupEntriesService } from './lineup-entries.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { SaveLineupDto } from './dto/save-lineup.dto';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly lineupService: LineupEntriesService,
  ) {}

  @Post('teams/:teamId/games')
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: CreateGameDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.gamesService.create(teamId, dto, req.user.sub);
  }

  @Get('teams/:teamId/games')
  findAll(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.gamesService.findAllForTeam(teamId);
  }

  @Patch('games/:gameId')
  update(
    @Param('gameId', ParseUUIDPipe) gameId: string,
    @Body() dto: UpdateGameDto,
  ) {
    return this.gamesService.update(gameId, dto);
  }

  @Delete('games/:gameId')
  remove(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.gamesService.remove(gameId);
  }

  @Get('games/:gameId/lineup')
  getLineup(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.lineupService.findByGame(gameId);
  }

  @Post('games/:gameId/lineup')
  saveLineup(
    @Param('gameId', ParseUUIDPipe) gameId: string,
    @Body() dto: SaveLineupDto,
  ) {
    return this.lineupService.saveLineup(gameId, dto);
  }
}
