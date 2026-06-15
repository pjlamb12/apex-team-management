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

  @Column({ name: 'drill_id', nullable: true })
  drillId: string | null;

  @ManyToOne(() => DrillEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'drill_id' })
  drill: DrillEntity | null;

  @Column({ name: 'custom_name', nullable: true })
  customName: string | null;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ name: 'duration_minutes', type: 'int', default: 0 })
  durationMinutes: number;

  @Column({ name: 'team_rating', type: 'int', nullable: true })
  teamRating: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
