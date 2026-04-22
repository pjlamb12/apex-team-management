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
import { DrillsService } from './drills.service';
import { CreateDrillDto } from './dto/create-drill.dto';
import { UpdateDrillDto } from './dto/update-drill.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('drills')
export class DrillsController {
  constructor(private readonly drillsService: DrillsService) {}

  @Get()
  findAll(
    @Request() req: { user: { sub: string } },
    @Query('tags') tags?: string | string[],
  ) {
    const tagIds = typeof tags === 'string' ? [tags] : tags;
    return this.drillsService.findAll(req.user.sub, tagIds);
  }

  @Get('tags')
  findAllTags(@Request() req: { user: { sub: string } }) {
    return this.drillsService.findAllTags(req.user.sub);
  }

  @Post('tags')
  createTag(
    @Request() req: { user: { sub: string } },
    @Body('name') name: string,
  ) {
    return this.drillsService.createTag(req.user.sub, name);
  }

  @Post()
  create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateDrillDto,
  ) {
    return this.drillsService.create(req.user.sub, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.drillsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateDrillDto,
  ) {
    return this.drillsService.update(id, req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.drillsService.remove(id, req.user.sub);
  }
}
