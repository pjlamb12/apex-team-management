import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId/players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  findAll(@Param('teamId') teamId: string) {
    return this.playersService.findAllForTeam(teamId);
  }

  @Post()
  create(@Param('teamId') teamId: string, @Body() data: CreatePlayerDto) {
    return this.playersService.create(teamId, data);
  }

  @Patch(':id')
  update(
    @Param('teamId') teamId: string,
    @Param('id') id: string,
    @Body() data: UpdatePlayerDto,
  ) {
    return this.playersService.update(teamId, id, data);
  }

  @Delete(':id')
  remove(@Param('teamId') teamId: string, @Param('id') id: string) {
    return this.playersService.remove(teamId, id);
  }
}
