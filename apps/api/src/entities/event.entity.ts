import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SeasonEntity } from './season.entity';
import { PracticeDrillEntity } from './practice-drill.entity';
import { LocationEntity } from './location.entity';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SeasonEntity)
  @JoinColumn({ name: 'season_id' })
  season: SeasonEntity;

  @Column({ name: 'season_id' })
  seasonId: string;

  @OneToMany(() => PracticeDrillEntity, (pd) => pd.event)
  practiceDrills: PracticeDrillEntity[];

  @Column({ default: 'game' })
  type: 'game' | 'practice';

  @Column({ nullable: true })
  opponent: string;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number | null;

  @Column({ nullable: true })
  location: string | null;

  @ManyToOne(() => LocationEntity, (loc) => loc.events)
  @JoinColumn({ name: 'location_id' })
  locationRef: LocationEntity | null;

  @Column({ name: 'location_id', nullable: true })
  locationId: string | null;

  @Column({ name: 'uniform_color', nullable: true })
  uniformColor: string | null;

  @Column({ name: 'is_home_game', default: true })
  isHomeGame: boolean;

  @Column({ default: 'scheduled' })
  status: 'scheduled' | 'in_progress' | 'completed';

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'goals_for', type: 'int', nullable: true })
  goalsFor: number | null;

  @Column({ name: 'goals_against', type: 'int', nullable: true })
  goalsAgainst: number | null;

  @Column({ name: 'period_count', type: 'int', nullable: true })
  periodCount: number | null;

  @Column({ name: 'period_length_minutes', type: 'int', nullable: true })
  periodLengthMinutes: number | null;

  @Column({ name: 'players_on_field', type: 'int', nullable: true })
  playersOnField: number | null;

  @Column({ name: 'current_period', type: 'int', default: 1 })
  currentPeriod: number;

  @Column({ name: 'recurrence_rule', type: 'text', nullable: true })
  recurrenceRule: string | null;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'parent_event_id' })
  parentEvent: EventEntity | null;

  @Column({ name: 'parent_event_id', nullable: true })
  parentEventId: string | null;

  @Column({ name: 'weather_data', type: 'jsonb', nullable: true })
  weatherData: any | null;

  @Column({ name: 'weather_last_updated', type: 'timestamp', nullable: true })
  weatherLastUpdated: Date | null;
}
