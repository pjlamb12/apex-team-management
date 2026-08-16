import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TeamEntity } from './team.entity';
import { PlayerEntity } from './player.entity';
import { SeasonEntity } from './season.entity';
import { PlayerGoalNoteEntity } from './player-goal-note.entity';

@Entity('player_goals')
export class PlayerGoalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TeamEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @Column({ name: 'team_id' })
  teamId: string;

  @ManyToOne(() => PlayerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ name: 'player_id' })
  playerId: string;

  @ManyToOne(() => SeasonEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'season_id' })
  season?: SeasonEntity | null;

  @Column({ name: 'season_id', nullable: true })
  seasonId?: string | null;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column({ default: 'in_progress' })
  status: string;

  @Column({ name: 'mastery_stage', default: 'emerging' })
  masteryStage: string;

  @Column({ default: 'full_season' })
  timeframe: string;

  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'baseline_assessment', type: 'text', nullable: true })
  baselineAssessment?: string | null;

  @OneToMany(() => PlayerGoalNoteEntity, (note) => note.goal)
  notes?: PlayerGoalNoteEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
