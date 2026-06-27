import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TeamEntity } from './team.entity';
import { EventEntity } from './event.entity';

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

  @Column({ name: 'default_practice_location', nullable: true })
  defaultPracticeLocation: string | null;

  @OneToMany(() => EventEntity, (event) => event.season)
  events: EventEntity[];
}
