import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';
import { TeamMemberEntity } from '../entities/team-member.entity';
import { EventNoteEntity } from '../entities/event-note.entity';
import { CandidateEvaluationEntity } from '../entities/candidate-evaluation.entity';
import { CandidateNoteEntity } from '../entities/candidate-note.entity';
import { DrillEntity } from '../entities/drill.entity';
import { TacticPlayEntity } from '../entities/tactic-play.entity';
import { TagEntity } from '../entities/tag.entity';
import { TeamsService } from '../teams/teams.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly teamsService: TeamsService,
    private readonly dataSource: DataSource,
  ) {}

  async signup(dto: SignupDto): Promise<{ accessToken: string }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
    });
    await this.userRepo.save(user);
    const payload: JwtPayload = { sub: user.id, email: user.email, displayName: user.displayName };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    // Generic error message to avoid user enumeration
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const payload: JwtPayload = { sub: user.id, email: user.email, displayName: user.displayName };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async refresh(userId: string, email: string): Promise<{ accessToken: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    // Re-sign to reset the 30-day sliding window (D-02)
    const payload: JwtPayload = { sub: userId, email, displayName: user?.displayName };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async getProfile(userId: string): Promise<{ id: string; email: string; displayName: string; createdAt: Date }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<{ id: string; email: string; displayName: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.displayName = dto.displayName;
    await this.userRepo.save(user);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(currentPass, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password incorrect');
    user.passwordHash = await bcrypt.hash(newPass, 12);
    await this.userRepo.save(user);
    return { message: 'Password updated successfully' };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // 1. Remove all teams owned by user (cascades seasons, players, events, line-ups, etc.)
    const teams = await this.teamsService.findAllByCoach(userId);
    for (const team of teams) {
      if (team.coachId === userId) {
        await this.teamsService.remove(team.id, userId);
      }
    }

    // 2. Clear memberships where user was assistant coach on other teams
    const memberRepo = this.dataSource.getRepository(TeamMemberEntity);
    await memberRepo.delete({ userId });

    // 3. Clear event notes authored by user
    const eventNoteRepo = this.dataSource.getRepository(EventNoteEntity);
    await eventNoteRepo.delete({ userId });

    // 4. Clear candidate evaluations and notes by coach
    const candidateEvalRepo = this.dataSource.getRepository(CandidateEvaluationEntity);
    await candidateEvalRepo.delete({ coachId: userId });
    const candidateNoteRepo = this.dataSource.getRepository(CandidateNoteEntity);
    await candidateNoteRepo.delete({ coachId: userId });

    // 5. Clear drills, tactic plays, and tags created by coach
    const drillRepo = this.dataSource.getRepository(DrillEntity);
    await drillRepo.delete({ coachId: userId });
    const tacticRepo = this.dataSource.getRepository(TacticPlayEntity);
    await tacticRepo.delete({ coachId: userId });
    const tagRepo = this.dataSource.getRepository(TagEntity);
    await tagRepo.delete({ coachId: userId });

    // 6. Delete user record
    await this.userRepo.remove(user);

    return { message: 'Account deleted successfully' };
  }
}
