import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SeasonEntity } from './season.entity';

@Entity('games')
export class GameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SeasonEntity)
  @JoinColumn({ name: 'season_id' })
  season: SeasonEntity;

  @Column({ name: 'season_id' })
  seasonId: string;

  @Column({ nullable: true })
  opponent: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  location: string | null;

  @Column({ name: 'uniform_color', nullable: true })
  uniformColor: string | null;

  @Column({ default: 'scheduled' })
  status: 'scheduled' | 'in_progress' | 'completed';
}
