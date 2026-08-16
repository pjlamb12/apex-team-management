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
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TacticsService } from './tactics.service';
import { CreateTacticPlayDto } from './dto/create-tactic-play.dto';
import { UpdateTacticPlayDto } from './dto/update-tactic-play.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('tactics')
export class TacticsController {
  constructor(private readonly tacticsService: TacticsService) {}

  @Get()
  findAll(
    @Request() req: { user: { sub: string } },
    @Query('sport') sport?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.tacticsService.findAll(req.user.sub, sport, category, search);
  }

  @Post()
  create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateTacticPlayDto,
  ) {
    return this.tacticsService.create(req.user.sub, dto);
  }

  @Post('seed-presets')
  seedPresets(
    @Request() req: { user: { sub: string } },
    @Body('sport') sport: string,
  ) {
    return this.tacticsService.seedPresets(req.user.sub, sport || 'soccer');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.tacticsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateTacticPlayDto,
  ) {
    return this.tacticsService.update(id, req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.tacticsService.remove(id, req.user.sub);
  }
}
