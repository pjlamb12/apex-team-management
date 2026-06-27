import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SportEntity } from './sport.entity';
import { SeasonEntity } from './season.entity';
import { UserEntity } from './user.entity';
import { TeamMemberEntity } from './team-member.entity';

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

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'coach_id' })
  coach: UserEntity;

  @Column({ name: 'coach_id', nullable: true })
  coachId: string;

  @Column({ name: 'join_code', unique: true, nullable: true })
  joinCode: string;

  @Column({ name: 'calendar_secret', unique: true, nullable: true })
  calendarSecret: string;

  @OneToMany(() => SeasonEntity, (season) => season.team)
  seasons: SeasonEntity[];

  @OneToMany(() => TeamMemberEntity, (member) => member.team)
  members: TeamMemberEntity[];
}
