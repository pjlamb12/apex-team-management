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

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ name: 'players_on_field', nullable: true, type: 'integer' })
  playersOnField: number | null;

  @Column({ name: 'period_count', nullable: true, type: 'integer' })
  periodCount: number | null;

  @Column({ name: 'period_length_minutes', nullable: true, type: 'integer' })
  periodLengthMinutes: number | null;
}
