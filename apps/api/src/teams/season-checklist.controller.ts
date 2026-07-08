import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SeasonChecklistService } from './season-checklist.service';

@UseGuards(AuthGuard('jwt'))
@Controller('seasons/:seasonId/checklist')
export class SeasonChecklistController {
  constructor(private readonly checklistService: SeasonChecklistService) {}

  @Get('items')
  findItems(@Param('seasonId', ParseUUIDPipe) seasonId: string) {
    return this.checklistService.findItems(seasonId);
  }

  @Post('items')
  createItem(
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
    @Body('name') name: string,
  ) {
    return this.checklistService.createItem(seasonId, name);
  }

  @Delete('items/:itemId')
  removeItem(
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.checklistService.removeItem(itemId);
  }

  @Get('values')
  findValues(@Param('seasonId', ParseUUIDPipe) seasonId: string) {
    return this.checklistService.findValues(seasonId);
  }

  @Post('values')
  upsertValue(
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
    @Body('playerId') playerId: string,
    @Body('itemId') itemId: string,
    @Body('value') value: string | null,
  ) {
    return this.checklistService.upsertValue(playerId, itemId, value);
  }
}
