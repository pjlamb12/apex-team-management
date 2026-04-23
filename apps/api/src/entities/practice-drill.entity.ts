import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { DrillEntity } from './drill.entity';

@Entity('practice_drills')
@Index(['eventId', 'sequence'])
export class PracticeDrillEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column({ name: 'drill_id' })
  drillId: string;

  @ManyToOne(() => DrillEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drill_id' })
  drill: DrillEntity;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ name: 'duration_minutes', type: 'int', default: 0 })
  durationMinutes: number;

  @Column({ name: 'team_rating', type: 'int', nullable: true })
  teamRating: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
