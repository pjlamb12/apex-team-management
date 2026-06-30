import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CandidateEntity } from './candidate.entity';
import { UserEntity } from './user.entity';
import { EventEntity } from './event.entity';

@Entity('candidate_notes')
export class CandidateNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CandidateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateEntity;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'coach_id' })
  coach: UserEntity;

  @Column({ name: 'coach_id' })
  coachId: string;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity | null;

  @Column({ name: 'event_id', nullable: true })
  eventId: string | null;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
