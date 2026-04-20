import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TeamEntity } from './team.entity';

@Entity('seasons')
export class SeasonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TeamEntity, (team) => team.seasons)
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @Column({ name: 'team_id' })
  teamId: string;

  @Column()
  name: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ name: 'is_active', default: false })
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

  @Column({ name: 'default_practice_location', nullable: true })
  defaultPracticeLocation: string | null;
}
