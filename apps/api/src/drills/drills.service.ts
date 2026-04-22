import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DrillEntity } from '../entities/drill.entity';
import { TagEntity } from '../entities/tag.entity';

@Injectable()
export class DrillsService {
  constructor(
    @InjectRepository(DrillEntity)
    private readonly drillRepo: Repository<DrillEntity>,
    @InjectRepository(TagEntity)
    private readonly tagRepo: Repository<TagEntity>,
  ) {}

  async findAll(coachId: string, tagIds?: string[]): Promise<DrillEntity[]> {
    const query = this.drillRepo
      .createQueryBuilder('drill')
      .leftJoinAndSelect('drill.tags', 'tag')
      .where('drill.coachId = :coachId', { coachId });

    if (tagIds && tagIds.length > 0) {
      // Pitfall 1 Mitigation: Double-join to filter by tags without ghosting other tags
      query.innerJoin('drill.tags', 'filterTag');
      query.andWhere('filterTag.id IN (:...tagIds)', { tagIds });
    }

    return query.getMany();
  }

  async findOne(id: string, coachId: string): Promise<DrillEntity> {
    const drill = await this.drillRepo.findOne({
      where: { id, coachId },
      relations: ['tags'],
    });

    if (!drill) {
      throw new NotFoundException(`Drill with ID ${id} not found`);
    }

    return drill;
  }

  async create(coachId: string, data: any): Promise<DrillEntity> {
    const { tagIds, ...drillData } = data;
    let tags: TagEntity[] = [];

    if (tagIds && tagIds.length > 0) {
      tags = await this.tagRepo.find({
        where: { id: In(tagIds), coachId },
      });
    }

    const drill = this.drillRepo.create({
      ...drillData,
      coachId,
      tags,
    } as any);

    return (await this.drillRepo.save(drill)) as any;
  }

  async update(id: string, coachId: string, data: any): Promise<DrillEntity> {
    const drill = await this.findOne(id, coachId);
    const { tagIds, ...drillData } = data;

    if (tagIds) {
      drill.tags = await this.tagRepo.find({
        where: { id: In(tagIds), coachId },
      });
    }

    Object.assign(drill, drillData);

    return this.drillRepo.save(drill);
  }

  async remove(id: string, coachId: string): Promise<void> {
    const drill = await this.findOne(id, coachId);
    await this.drillRepo.remove(drill);
  }

  async findAllTags(coachId: string): Promise<TagEntity[]> {
    return this.tagRepo.find({
      where: { coachId },
      order: { name: 'ASC' },
    });
  }

  async createTag(coachId: string, name: string): Promise<TagEntity> {
    const tag = this.tagRepo.create({ coachId, name });
    return this.tagRepo.save(tag);
  }
}
