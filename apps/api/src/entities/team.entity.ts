import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SportEntity } from './sport.entity';
import { SeasonEntity } from './season.entity';
import { UserEntity } from './user.entity';

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

  @OneToMany(() => SeasonEntity, (season) => season.team)
  seasons: SeasonEntity[];
}
