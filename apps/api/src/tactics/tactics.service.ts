import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TacticPlayEntity } from '../entities/tactic-play.entity';
import { CreateTacticPlayDto } from './dto/create-tactic-play.dto';
import { UpdateTacticPlayDto } from './dto/update-tactic-play.dto';

@Injectable()
export class TacticsService {
  constructor(
    @InjectRepository(TacticPlayEntity)
    private readonly tacticPlayRepo: Repository<TacticPlayEntity>,
  ) {}

  async findAll(
    coachId: string,
    sport?: string,
    category?: string,
    search?: string,
  ): Promise<TacticPlayEntity[]> {
    const query = this.tacticPlayRepo
      .createQueryBuilder('play')
      .where('play.coachId = :coachId', { coachId })
      .orderBy('play.updatedAt', 'DESC');

    if (sport) {
      query.andWhere('LOWER(play.sport) = LOWER(:sport)', { sport });
    }

    if (category && category !== 'all') {
      query.andWhere('LOWER(play.category) = LOWER(:category)', { category });
    }

    if (search && search.trim().length > 0) {
      query.andWhere(
        '(LOWER(play.title) LIKE LOWER(:search) OR LOWER(play.description) LIKE LOWER(:search) OR :rawSearch = ANY(play.tags))',
        { search: `%${search.trim()}%`, rawSearch: search.trim() },
      );
    }

    return query.getMany();
  }

  async findOne(id: string, coachId: string): Promise<TacticPlayEntity> {
    const play = await this.tacticPlayRepo.findOne({
      where: { id, coachId },
    });

    if (!play) {
      throw new NotFoundException(`Tactic play with ID ${id} not found`);
    }

    return play;
  }

  async create(coachId: string, dto: CreateTacticPlayDto): Promise<TacticPlayEntity> {
    const play = this.tacticPlayRepo.create({
      ...dto,
      coachId,
      sport: dto.sport.toLowerCase(),
      category: (dto.category || 'formation').toLowerCase(),
      pitchType: dto.pitchType || (dto.sport.toLowerCase() === 'volleyball' ? 'full_court' : 'full_pitch'),
      tags: dto.tags || [],
    });

    return this.tacticPlayRepo.save(play);
  }

  async update(
    id: string,
    coachId: string,
    dto: UpdateTacticPlayDto,
  ): Promise<TacticPlayEntity> {
    const play = await this.findOne(id, coachId);

    if (dto.sport) {
      dto.sport = dto.sport.toLowerCase();
    }
    if (dto.category) {
      dto.category = dto.category.toLowerCase();
    }

    Object.assign(play, dto);
    return this.tacticPlayRepo.save(play);
  }

  async remove(id: string, coachId: string): Promise<void> {
    const play = await this.findOne(id, coachId);
    await this.tacticPlayRepo.remove(play);
  }

  async seedPresets(coachId: string, sport: string): Promise<TacticPlayEntity[]> {
    const normalizedSport = sport.toLowerCase();
    const createdPlays: TacticPlayEntity[] = [];

    if (normalizedSport === 'soccer') {
      const presets: CreateTacticPlayDto[] = [
        {
          title: 'Standard 4-3-3 Balanced',
          description: 'Modern 4-3-3 formation with holding midfielder and wide wingers.',
          sport: 'soccer',
          category: 'formation',
          pitchType: 'full_pitch',
          tags: ['4-3-3', 'Possession', 'Balanced'],
          notes: 'Encourage inverted wingers to link with overlapping fullbacks.',
          canvasData: {
            pitchType: 'full_pitch',
            tokens: [
              { id: 't1', label: '1', role: 'GK', team: 'home', x: 8, y: 50 },
              { id: 't2', label: '2', role: 'RB', team: 'home', x: 25, y: 85 },
              { id: 't3', label: '4', role: 'CB', team: 'home', x: 22, y: 62 },
              { id: 't4', label: '5', role: 'CB', team: 'home', x: 22, y: 38 },
              { id: 't5', label: '3', role: 'LB', team: 'home', x: 25, y: 15 },
              { id: 't6', label: '6', role: 'CDM', team: 'home', x: 38, y: 50 },
              { id: 't7', label: '8', role: 'CM', team: 'home', x: 52, y: 68 },
              { id: 't8', label: '10', role: 'CAM', team: 'home', x: 52, y: 32 },
              { id: 't9', label: '7', role: 'RW', team: 'home', x: 70, y: 82 },
              { id: 't10', label: '9', role: 'ST', team: 'home', x: 75, y: 50 },
              { id: 't11', label: '11', role: 'LW', team: 'home', x: 70, y: 18 },
              { id: 'ball', label: '', team: 'ball', x: 38, y: 53 },
            ],
            drawings: [],
          },
        },
        {
          title: 'Inswinging Corner Kick Routine',
          description: 'Near-post decoy run opening space for back-post header.',
          sport: 'soccer',
          category: 'set_piece',
          pitchType: 'half_pitch',
          tags: ['Corner', 'Set Piece', 'Attacking'],
          notes: 'Taker delivers high curling ball towards the 6-yard box.',
          canvasData: {
            pitchType: 'half_pitch',
            tokens: [
              { id: 'c1', label: '7', role: 'Taker', team: 'home', x: 97, y: 95 },
              { id: 'c2', label: '9', role: 'Near Post', team: 'home', x: 86, y: 58 },
              { id: 'c3', label: '4', role: 'Far Post', team: 'home', x: 84, y: 42 },
              { id: 'c4', label: '10', role: 'Edge of Box', team: 'home', x: 70, y: 50 },
              { id: 'd1', label: 'GK', role: 'GK', team: 'away', x: 96, y: 50 },
              { id: 'd2', label: 'D1', role: 'Def', team: 'away', x: 92, y: 58 },
              { id: 'd3', label: 'D2', role: 'Def', team: 'away', x: 90, y: 44 },
              { id: 'ball', label: '', team: 'ball', x: 97, y: 95 },
            ],
            drawings: [
              {
                id: 'd_pass',
                tool: 'pass',
                color: '#facc15',
                width: 3,
                points: [
                  { x: 97, y: 95 },
                  { x: 88, y: 48 },
                ],
              },
              {
                id: 'd_run1',
                tool: 'run',
                color: '#38bdf8',
                width: 3,
                points: [
                  { x: 86, y: 58 },
                  { x: 93, y: 55 },
                ],
              },
            ],
          },
        },
      ];

      for (const p of presets) {
        createdPlays.push(await this.create(coachId, p));
      }
    } else if (normalizedSport === 'volleyball') {
      const presets: CreateTacticPlayDto[] = [
        {
          title: '5-1 System - Rotation 1 (Setter in Pos 1)',
          description: 'Starting rotation with setter back-right serving or in serve-receive.',
          sport: 'volleyball',
          category: 'formation',
          pitchType: 'full_court',
          tags: ['5-1', 'Rotation 1', 'Serve Receive'],
          notes: 'Setter penetrates to target zone immediately after opponent contact.',
          canvasData: {
            pitchType: 'full_court',
            tokens: [
              { id: 'v1', label: 'S', role: 'Setter', team: 'home', x: 38, y: 78 },
              { id: 'v2', label: 'OH1', role: 'Outside 1', team: 'home', x: 38, y: 22 },
              { id: 'v3', label: 'MB1', role: 'Middle 1', team: 'home', x: 44, y: 35 },
              { id: 'v4', label: 'OPP', role: 'Opposite', team: 'home', x: 44, y: 65 },
              { id: 'v5', label: 'OH2', role: 'Outside 2', team: 'home', x: 32, y: 35 },
              { id: 'v6', label: 'L', role: 'Libero', team: 'home', x: 28, y: 50 },
              { id: 'ball', label: '', team: 'ball', x: 38, y: 82 },
            ],
            drawings: [],
          },
        },
        {
          title: 'Perimeter Defense (Middle-Back Deep)',
          description: 'Standard 3-passer perimeter defensive coverage against outside attack.',
          sport: 'volleyball',
          category: 'defensive',
          pitchType: 'full_court',
          tags: ['Defense', 'Perimeter', 'Transition'],
          notes: 'Left-back covers sharp cross, Middle-back covers deep line/corners.',
          canvasData: {
            pitchType: 'full_court',
            tokens: [
              { id: 'vd1', label: 'B1', role: 'Blocker Left', team: 'home', x: 48, y: 28 },
              { id: 'vd2', label: 'B2', role: 'Blocker Middle', team: 'home', x: 48, y: 40 },
              { id: 'vd3', label: 'LB', role: 'Dig Left', team: 'home', x: 25, y: 25 },
              { id: 'vd4', label: 'MB', role: 'Dig Deep', team: 'home', x: 18, y: 50 },
              { id: 'vd5', label: 'RB', role: 'Dig Right', team: 'home', x: 25, y: 75 },
              { id: 'vd6', label: 'S', role: 'Off-Blocker', team: 'home', x: 42, y: 70 },
              { id: 'ball', label: '', team: 'ball', x: 55, y: 28 },
            ],
            drawings: [
              {
                id: 'vd_zone',
                tool: 'zone_circle',
                color: '#38bdf8',
                width: 2,
                points: [
                  { x: 25, y: 25 },
                  { x: 35, y: 35 },
                ],
              },
            ],
          },
        },
      ];

      for (const p of presets) {
        createdPlays.push(await this.create(coachId, p));
      }
    }

    return createdPlays;
  }
}
