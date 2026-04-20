import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EventEntity } from './event.entity';

@Entity('game_events')
export class GameEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ name: 'minute_occurred', type: 'int', nullable: true })
  minuteOccurred: number;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;
}
