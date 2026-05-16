import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CandidateEntity } from './candidate.entity';
import { EventEntity } from './event.entity';

export type CandidateAttendanceStatus = 'present' | 'absent' | 'tardy';

@Entity('candidate_attendance')
export class CandidateAttendanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CandidateEntity)
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateEntity;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ default: 'present' })
  status: CandidateAttendanceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
