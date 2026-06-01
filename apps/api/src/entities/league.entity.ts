import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SeasonEntity } from './season.entity';
import { EventEntity } from './event.entity';

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

  @OneToMany(() => EventEntity, (event) => event.league)
  events: EventEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
