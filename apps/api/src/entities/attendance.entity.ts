import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { EventEntity } from './event.entity';
import { PlayerEntity } from './player.entity';

@Entity('attendance')
@Unique(['eventId', 'playerId'])
export class AttendanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => PlayerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ name: 'player_id' })
  playerId: string;

  @Column({
    default: 'absent'
  })
  status: 'present' | 'absent' | 'tardy' | 'injured';

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
