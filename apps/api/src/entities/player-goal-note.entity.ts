import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlayerGoalEntity } from './player-goal.entity';
import { TeamEntity } from './team.entity';
import { PlayerEntity } from './player.entity';
import { EventEntity } from './event.entity';

@Entity('player_goal_notes')
export class PlayerGoalNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PlayerGoalEntity, (goal) => goal.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: PlayerGoalEntity;

  @Column({ name: 'goal_id' })
  goalId: string;

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

  @ManyToOne(() => EventEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'event_id' })
  event?: EventEntity | null;

  @Column({ name: 'event_id', nullable: true })
  eventId?: string | null;

  @Column({ name: 'stage', nullable: true })
  stage?: string | null;

  @Column({ type: 'text' })
  note: string;

  @Column({ name: 'observed_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  observedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
