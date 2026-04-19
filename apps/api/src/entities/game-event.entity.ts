import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GameEntity } from './game.entity';

@Entity('game_events')
export class GameEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GameEntity)
  @JoinColumn({ name: 'game_id' })
  game: GameEntity;

  @Column({ name: 'game_id' })
  gameId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ name: 'minute_occurred', type: 'int', nullable: true })
  minuteOccurred: number;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;
}
