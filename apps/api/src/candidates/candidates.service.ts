import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity, CandidateStatus } from '../entities/candidate.entity';
import { CandidateAttendanceEntity, CandidateAttendanceStatus } from '../entities/candidate-attendance.entity';
import { PlayersService } from '../players/players.service';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(CandidateAttendanceEntity)
    private readonly attendanceRepo: Repository<CandidateAttendanceEntity>,
    private readonly playersService: PlayersService,
  ) {}

  async findAll(teamId: string): Promise<CandidateEntity[]> {
    return this.candidateRepo.find({
      where: { teamId },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async findOne(id: string): Promise<CandidateEntity> {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async create(teamId: string, data: Partial<CandidateEntity>): Promise<CandidateEntity> {
    const candidate = this.candidateRepo.create({ ...data, teamId });
    return this.candidateRepo.save(candidate);
  }

  async update(id: string, data: Partial<CandidateEntity>): Promise<CandidateEntity> {
    const candidate = await this.findOne(id);
    Object.assign(candidate, data);
    return this.candidateRepo.save(candidate);
  }

  async remove(id: string): Promise<void> {
    const candidate = await this.findOne(id);
    await this.candidateRepo.remove(candidate);
  }

  // Attendance methods
  async getAttendance(eventId: string): Promise<CandidateAttendanceEntity[]> {
    return this.attendanceRepo.find({
      where: { eventId },
      relations: ['candidate'],
    });
  }

  async markAttendance(candidateId: string, eventId: string, status: CandidateAttendanceStatus, notes?: string): Promise<CandidateAttendanceEntity> {
    let attendance = await this.attendanceRepo.findOne({
      where: { candidateId, eventId },
    });

    if (attendance) {
      attendance.status = status;
      if (notes !== undefined) attendance.notes = notes;
    } else {
      attendance = this.attendanceRepo.create({
        candidateId,
        eventId,
        status,
        notes,
      });
    }

    return this.attendanceRepo.save(attendance);
  }

  async promote(teamId: string, id: string): Promise<any> {
    const candidate = await this.findOne(id);
    
    // 1. Check if already promoted (status 'accepted' or similar)
    if (candidate.status === 'accepted') {
      throw new ConflictException('Candidate has already been accepted/promoted.');
    }

    // 2. Create the player (Jersey number defaults to 0 for tryouts)
    const player = await this.playersService.create(teamId, {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      parentEmail: candidate.parentEmail,
      jerseyNumber: 0,
    });

    // 3. Update candidate status
    candidate.status = 'accepted';
    await this.candidateRepo.save(candidate);

    return player;
  }
}
