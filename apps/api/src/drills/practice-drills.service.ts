import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { PracticeDrillEntity } from '../entities/practice-drill.entity';
import { EventEntity } from '../entities/event.entity';
import { DrillEntity } from '../entities/drill.entity';
import { AddDrillToPlanDto } from './dto/add-drill-to-plan.dto';
import { UpdatePracticeDrillDto } from './dto/update-practice-drill.dto';
import { ReorderPracticeDrillsDto } from './dto/reorder-practice-drills.dto';

@Injectable()
export class PracticeDrillsService {
  constructor(
    @InjectRepository(PracticeDrillEntity)
    private readonly practiceDrillRepo: Repository<PracticeDrillEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(DrillEntity)
    private readonly drillRepo: Repository<DrillEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllForEvent(userId: string, eventId: string): Promise<PracticeDrillEntity[]> {
    const event = await this.getEventWithOwnerCheck(userId, eventId);
    return this.practiceDrillRepo.find({
      where: { eventId: event.id },
      relations: ['drill', 'drill.tags'],
      order: { sequence: 'ASC' },
    });
  }

  async addDrillToPlan(
    userId: string,
    eventId: string,
    dto: AddDrillToPlanDto,
  ): Promise<PracticeDrillEntity> {
    const event = await this.getEventWithOwnerCheck(userId, eventId);
    if (event.type !== 'practice') {
      throw new BadRequestException('Drills can only be added to practice events');
    }

    const drill = await this.drillRepo.findOne({
      where: { id: dto.drillId, coachId: userId },
    });

    if (!drill) {
      throw new NotFoundException('Drill not found or access denied');
    }

    const maxSequence = await this.practiceDrillRepo.maximum('sequence', {
      eventId,
    });
    const sequence = (maxSequence || 0) + 1;

    const practiceDrill = this.practiceDrillRepo.create({
      ...dto,
      eventId,
      sequence,
    });

    const saved = await this.practiceDrillRepo.save(practiceDrill);
    return this.practiceDrillRepo.findOne({
      where: { id: saved.id },
      relations: ['drill', 'drill.tags'],
    }) as Promise<PracticeDrillEntity>;
  }

  async update(
    userId: string,
    eventId: string,
    practiceDrillId: string,
    dto: UpdatePracticeDrillDto,
  ): Promise<PracticeDrillEntity> {
    const event = await this.getEventWithOwnerCheck(userId, eventId);
    const practiceDrill = await this.practiceDrillRepo.findOne({
      where: { id: practiceDrillId, eventId },
    });

    if (!practiceDrill) {
      throw new NotFoundException('Practice drill association not found');
    }

    if (dto.teamRating !== undefined) {
      if (event.status === 'scheduled') {
        throw new BadRequestException(
          'Team rating can only be set for in-progress or completed practices',
        );
      }
    }

    Object.assign(practiceDrill, dto);
    await this.practiceDrillRepo.save(practiceDrill);

    return this.practiceDrillRepo.findOne({
      where: { id: practiceDrillId },
      relations: ['drill', 'drill.tags'],
    }) as Promise<PracticeDrillEntity>;
  }

  async remove(userId: string, eventId: string, practiceDrillId: string): Promise<void> {
    await this.getEventWithOwnerCheck(userId, eventId);
    const result = await this.practiceDrillRepo.delete({
      id: practiceDrillId,
      eventId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Practice drill association not found');
    }
  }

  async reorder(
    userId: string,
    eventId: string,
    dto: ReorderPracticeDrillsDto,
  ): Promise<void> {
    await this.getEventWithOwnerCheck(userId, eventId);

    const practiceDrills = await this.practiceDrillRepo.find({
      where: { eventId, id: In(dto.ids) },
    });

    if (practiceDrills.length !== dto.ids.length) {
      throw new BadRequestException('Some practice drill IDs are invalid or belong to another event');
    }

    await this.dataSource.transaction(async (manager) => {
      for (let i = 0; i < dto.ids.length; i++) {
        await manager.update(
          PracticeDrillEntity,
          { id: dto.ids[i], eventId },
          { sequence: i + 1 },
        );
      }
    });
  }

  private async getEventWithOwnerCheck(userId: string, eventId: string): Promise<EventEntity> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['season', 'season.team'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.season.team.coachId !== userId) {
      throw new ForbiddenException('Access denied to this event');
    }

    return event;
  }
}
