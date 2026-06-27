import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SeasonEntity } from './season.entity';
import { EventEntity } from './event.entity';
import { LocationEntity } from './location.entity';

export type LeagueType = 'league' | 'tournament' | 'session' | 'cup' | 'other';

@Entity('leagues')
export class LeagueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SeasonEntity)
  @JoinColumn({ name: 'season_id' })
  season: SeasonEntity;

  @Column({ name: 'season_id' })
  seasonId: string;

  @Column()
  name: string;

  @Column({ default: 'league' })
  type: LeagueType;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'players_on_field', nullable: true, type: 'integer' })
  playersOnField: number | null;

  @Column({ name: 'period_count', nullable: true, type: 'integer' })
  periodCount: number | null;

  @Column({ name: 'period_length_minutes', nullable: true, type: 'integer' })
  periodLengthMinutes: number | null;

  @Column({ name: 'default_home_venue', nullable: true })
  defaultHomeVenue: string | null;

  @Column({ name: 'default_home_color', nullable: true })
  defaultHomeColor: string | null;

  @Column({ name: 'default_away_color', nullable: true })
  defaultAwayColor: string | null;

  @ManyToOne(() => LocationEntity)
  @JoinColumn({ name: 'home_location_id' })
  homeLocation: LocationEntity | null;

  @Column({ name: 'home_location_id', nullable: true })
  homeLocationId: string | null;

  @OneToMany(() => EventEntity, (event) => event.league)
  events: EventEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
