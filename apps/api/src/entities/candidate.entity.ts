import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TeamEntity } from './team.entity';

export type CandidateStatus = 'interested' | 'invited' | 'offered' | 'accepted' | 'declined';

@Entity('candidates')
export class CandidateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ name: 'parent_name', nullable: true })
  parentName: string | null;

  @Column({ name: 'parent_email' })
  parentEmail: string;

  @Column({ name: 'parent_phone', nullable: true })
  parentPhone: string | null;

  @Column({ name: 'preferred_position', nullable: true })
  preferredPosition: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ default: 'interested' })
  status: CandidateStatus;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @Column({ name: 'team_id' })
  teamId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
