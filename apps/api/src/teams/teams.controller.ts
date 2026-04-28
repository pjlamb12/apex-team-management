import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JoinTeamDto } from './dto/join-team.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'))
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll(@Request() req: { user: { sub: string } }) {
    return this.teamsService.findAllByCoach(req.user.sub);
  }

  @Post()
  create(@Body() dto: CreateTeamDto, @Request() req: { user: { sub: string } }) {
    return this.teamsService.create(dto, req.user.sub);
  }

  @Post('join')
  join(@Body() dto: JoinTeamDto, @Request() req: { user: { sub: string } }) {
    return this.teamsService.join(req.user.sub, dto.code);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH)
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }

  @Post(':id/code/regenerate')
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH)
  regenerateCode(@Param('id') id: string) {
    return this.teamsService.regenerateCode(id);
  }
}
