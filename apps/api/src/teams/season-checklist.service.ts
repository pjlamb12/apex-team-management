import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeasonChecklistItemEntity } from '../entities/season-checklist-item.entity';
import { SeasonChecklistValueEntity } from '../entities/season-checklist-value.entity';

@Injectable()
export class SeasonChecklistService {
  constructor(
    @InjectRepository(SeasonChecklistItemEntity)
    private readonly itemRepo: Repository<SeasonChecklistItemEntity>,
    @InjectRepository(SeasonChecklistValueEntity)
    private readonly valueRepo: Repository<SeasonChecklistValueEntity>,
  ) {}

  async findItems(seasonId: string): Promise<SeasonChecklistItemEntity[]> {
    return this.itemRepo.find({
      where: { seasonId },
      order: { createdAt: 'ASC' },
    });
  }

  async createItem(seasonId: string, name: string): Promise<SeasonChecklistItemEntity> {
    const item = this.itemRepo.create({ seasonId, name });
    return this.itemRepo.save(item);
  }

  async removeItem(id: string): Promise<void> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Checklist item with ID ${id} not found`);
    }
    await this.itemRepo.remove(item);
  }

  async findValues(seasonId: string): Promise<SeasonChecklistValueEntity[]> {
    return this.valueRepo.find({
      relations: ['item'],
      where: {
        item: { seasonId },
      },
    });
  }

  async upsertValue(
    playerId: string,
    itemId: string,
    value: string | null,
  ): Promise<SeasonChecklistValueEntity> {
    let checklistValue = await this.valueRepo.findOne({
      where: { playerId, itemId },
    });

    if (checklistValue) {
      checklistValue.value = value;
    } else {
      checklistValue = this.valueRepo.create({
        playerId,
        itemId,
        value,
      });
    }

    return this.valueRepo.save(checklistValue);
  }
}
