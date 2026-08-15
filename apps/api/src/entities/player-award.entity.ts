import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TeamEntity } from './team.entity';
import { PlayerEntity } from './player.entity';
import { EventEntity } from './event.entity';
import { SeasonEntity } from './season.entity';

@Entity('player_awards')
export class PlayerAwardEntity {
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

  @ManyToOne(() => EventEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'event_id' })
  event?: EventEntity | null;

  @Column({ name: 'event_id', nullable: true })
  eventId?: string | null;

  @ManyToOne(() => SeasonEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'season_id' })
  season?: SeasonEntity | null;

  @Column({ name: 'season_id', nullable: true })
  seasonId?: string | null;

  @Column({ name: 'badge_type' })
  badgeType: string;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'awarded_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  awardedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
