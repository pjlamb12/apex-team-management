import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AwardsService } from './awards.service';
import { CreateAwardDto, BatchCreateAwardsDto } from './dto/create-award.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId')
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Get('awards')
  findAll(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('seasonId') seasonId?: string,
    @Query('playerId') playerId?: string,
    @Query('eventId') eventId?: string,
    @Query('category') category?: string,
  ) {
    return this.awardsService.findAll(teamId, {
      seasonId,
      playerId,
      eventId,
      category,
    });
  }

  @Get('awards/summary')
  getSummary(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.awardsService.getSummary(teamId, seasonId);
  }

  @Get('players/:playerId/awards')
  findByPlayer(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('playerId', ParseUUIDPipe) playerId: string,
  ) {
    return this.awardsService.findByPlayer(teamId, playerId);
  }

  @Get('events/:eventId/awards')
  findByEvent(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.awardsService.findByEvent(teamId, eventId);
  }

  @Post('awards')
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: CreateAwardDto,
  ) {
    return this.awardsService.create(teamId, dto);
  }

  @Post('awards/batch')
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  createBatch(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() body: BatchCreateAwardsDto,
  ) {
    return this.awardsService.createBatch(teamId, body.awards);
  }

  @Delete('awards/:awardId')
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  delete(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('awardId', ParseUUIDPipe) awardId: string,
  ) {
    return this.awardsService.delete(teamId, awardId);
  }
}
