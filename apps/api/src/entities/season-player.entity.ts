import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { SeasonEntity } from './season.entity';
import { PlayerEntity } from './player.entity';

@Entity('season_players')
export class SeasonPlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SeasonEntity)
  @JoinColumn({ name: 'season_id' })
  season: SeasonEntity;

  @Column({ name: 'season_id' })
  seasonId: string;

  @ManyToOne(() => PlayerEntity)
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ name: 'player_id' })
  playerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
