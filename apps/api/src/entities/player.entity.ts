import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TeamEntity } from './team.entity';
import { LeagueEntity } from './league.entity';

@Entity('players')
export class PlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'jersey_number', nullable: true })
  jerseyNumber: number;

  @Column({ name: 'preferred_position', nullable: true })
  preferredPosition: string;

  @Column({ name: 'parent_email', nullable: true })
  parentEmail: string;

  @Column({ name: 'is_guest', type: 'boolean', default: false })
  isGuest: boolean;

  @ManyToOne(() => LeagueEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'league_id' })
  league: LeagueEntity | null;

  @Column({ name: 'league_id', nullable: true })
  leagueId: string | null;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @Column({ name: 'team_id' })
  teamId: string;
}

