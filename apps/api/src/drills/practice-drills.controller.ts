import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PracticeDrillsService } from './practice-drills.service';
import { AddDrillToPlanDto } from './dto/add-drill-to-plan.dto';
import { UpdatePracticeDrillDto } from './dto/update-practice-drill.dto';
import { ReorderPracticeDrillsDto } from './dto/reorder-practice-drills.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId/events/:eventId/drills')
export class PracticeDrillsController {
  constructor(private readonly practiceDrillsService: PracticeDrillsService) {}

  @Get()
  findAll(
    @Request() req: { user: { sub: string } },
    @Param('eventId') eventId: string,
  ) {
    return this.practiceDrillsService.findAllForEvent(req.user.sub, eventId);
  }

  @Post()
  add(
    @Request() req: { user: { sub: string } },
    @Param('eventId') eventId: string,
    @Body() dto: AddDrillToPlanDto,
  ) {
    return this.practiceDrillsService.addDrillToPlan(req.user.sub, eventId, dto);
  }

  @Patch(':id')
  update(
    @Request() req: { user: { sub: string } },
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePracticeDrillDto,
  ) {
    return this.practiceDrillsService.update(req.user.sub, eventId, id, dto);
  }

  @Delete(':id')
  remove(
    @Request() req: { user: { sub: string } },
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ) {
    return this.practiceDrillsService.remove(req.user.sub, eventId, id);
  }

  @Put('reorder')
  reorder(
    @Request() req: { user: { sub: string } },
    @Param('eventId') eventId: string,
    @Body() dto: ReorderPracticeDrillsDto,
  ) {
    return this.practiceDrillsService.reorder(req.user.sub, eventId, dto);
  }
}
