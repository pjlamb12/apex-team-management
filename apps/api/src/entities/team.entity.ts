import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SportEntity } from './sport.entity';
import { SeasonEntity } from './season.entity';

@Entity('teams')
export class TeamEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => SportEntity)
  @JoinColumn({ name: 'sport_id' })
  sport: SportEntity;

  @Column({ name: 'sport_id' })
  sportId: string;

  @Column({ name: 'players_on_field', default: 11 })
  playersOnField: number;

  @Column({ name: 'period_count', default: 2 })
  periodCount: number;

  @Column({ name: 'period_length_minutes', default: 45 })
  periodLengthMinutes: number;

  @OneToMany(() => SeasonEntity, (season) => season.team)
  seasons: SeasonEntity[];
}
