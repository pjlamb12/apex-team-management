import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GameEntity } from './game.entity';
import { PlayerEntity } from './player.entity';

@Entity('lineup_entries')
export class LineupEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GameEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: GameEntity;

  @Column({ name: 'game_id' })
  gameId: string;

  @ManyToOne(() => PlayerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ name: 'player_id' })
  playerId: string;

  @Column({ name: 'position_name', nullable: true })
  positionName: string | null;

  @Column({ name: 'slot_index', nullable: true, type: 'integer' })
  slotIndex: number | null;

  @Column({ default: 'bench' })
  status: 'starting' | 'bench';
}
