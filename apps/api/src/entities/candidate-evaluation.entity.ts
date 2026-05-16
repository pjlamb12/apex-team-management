import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CandidateEntity } from './candidate.entity';
import { EventEntity } from './event.entity';
import { ScoutingRubricEntity } from './scouting-rubric.entity';
import { UserEntity } from './user.entity';

@Entity('candidate_evaluations')
export class CandidateEvaluationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CandidateEntity)
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateEntity;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity | null;

  @Column({ name: 'event_id', nullable: true })
  eventId: string | null;

  @ManyToOne(() => ScoutingRubricEntity)
  @JoinColumn({ name: 'rubric_id' })
  rubric: ScoutingRubricEntity;

  @Column({ name: 'rubric_id' })
  rubricId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'coach_id' })
  coach: UserEntity;

  @Column({ name: 'coach_id' })
  coachId: string;

  @Column()
  rating: number; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
