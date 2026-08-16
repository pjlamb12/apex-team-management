import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('tactic_plays')
export class TacticPlayEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coach_id' })
  @Index()
  coachId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coach_id' })
  coach: UserEntity;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column()
  @Index()
  sport: string; // 'soccer' | 'volleyball'

  @Column({ default: 'formation' })
  @Index()
  category: string; // 'formation' | 'set_piece' | 'offensive' | 'defensive' | 'transition' | 'drill_setup' | 'other'

  @Column({ name: 'pitch_type', default: 'full_pitch' })
  pitchType: string;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'canvas_data', type: 'jsonb' })
  canvasData: any;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
