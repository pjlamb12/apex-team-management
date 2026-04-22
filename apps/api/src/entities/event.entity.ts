import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SeasonEntity } from './season.entity';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SeasonEntity)
  @JoinColumn({ name: 'season_id' })
  season: SeasonEntity;

  @Column({ name: 'season_id' })
  seasonId: string;

  @Column({ default: 'game' })
  type: 'game' | 'practice';

  @Column({ nullable: true })
  opponent: string;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number | null;

  @Column({ nullable: true })
  location: string | null;

  @Column({ name: 'uniform_color', nullable: true })
  uniformColor: string | null;

  @Column({ name: 'is_home_game', default: true })
  isHomeGame: boolean;

  @Column({ default: 'scheduled' })
  status: 'scheduled' | 'in_progress' | 'completed';

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'goals_for', type: 'int', nullable: true })
  goalsFor: number | null;

  @Column({ name: 'goals_against', type: 'int', nullable: true })
  goalsAgainst: number | null;

  @Column({ name: 'period_count', type: 'int', nullable: true })
  periodCount: number | null;

  @Column({ name: 'period_length_minutes', type: 'int', nullable: true })
  periodLengthMinutes: number | null;

  @Column({ name: 'current_period', type: 'int', default: 1 })
  currentPeriod: number;
}
