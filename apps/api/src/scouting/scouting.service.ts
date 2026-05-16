import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoutingRubricEntity } from '../entities/scouting-rubric.entity';
import { CandidateEvaluationEntity } from '../entities/candidate-evaluation.entity';

@Injectable()
export class ScoutingService {
  constructor(
    @InjectRepository(ScoutingRubricEntity)
    private readonly rubricRepo: Repository<ScoutingRubricEntity>,
    @InjectRepository(CandidateEvaluationEntity)
    private readonly evaluationRepo: Repository<CandidateEvaluationEntity>,
  ) {}

  // Rubric Management
  async findAllRubrics(teamId: string): Promise<ScoutingRubricEntity[]> {
    return this.rubricRepo.find({
      where: { teamId },
      order: { name: 'ASC' },
    });
  }

  async createRubric(teamId: string, data: Partial<ScoutingRubricEntity>): Promise<ScoutingRubricEntity> {
    const rubric = this.rubricRepo.create({ ...data, teamId });
    return this.rubricRepo.save(rubric);
  }

  async updateRubric(id: string, data: Partial<ScoutingRubricEntity>): Promise<ScoutingRubricEntity> {
    const rubric = await this.rubricRepo.findOne({ where: { id } });
    if (!rubric) throw new NotFoundException('Rubric not found');
    Object.assign(rubric, data);
    return this.rubricRepo.save(rubric);
  }

  async removeRubric(id: string): Promise<void> {
    const rubric = await this.rubricRepo.findOne({ where: { id } });
    if (!rubric) throw new NotFoundException('Rubric not found');
    await this.rubricRepo.remove(rubric);
  }

  // Evaluation Management
  async findEvaluationsForCandidate(candidateId: string): Promise<CandidateEvaluationEntity[]> {
    return this.evaluationRepo.find({
      where: { candidateId },
      relations: ['rubric', 'coach', 'event'],
      order: { createdAt: 'DESC' },
    });
  }

  async recordEvaluation(coachId: string, data: Partial<CandidateEvaluationEntity>): Promise<CandidateEvaluationEntity> {
    // If an evaluation already exists for this candidate, event, and rubric by this coach, update it.
    // Otherwise, create a new one.
    let evaluation = await this.evaluationRepo.findOne({
      where: {
        candidateId: data.candidateId,
        eventId: data.eventId || null,
        rubricId: data.rubricId,
        coachId,
      },
    });

    if (evaluation) {
      evaluation.rating = data.rating!;
      evaluation.notes = data.notes || null;
    } else {
      evaluation = this.evaluationRepo.create({ ...data, coachId });
    }

    return this.evaluationRepo.save(evaluation);
  }
}
