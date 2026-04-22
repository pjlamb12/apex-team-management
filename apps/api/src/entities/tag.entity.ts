import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('tags')
@Unique(['coachId', 'name'])
export class TagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coach_id' })
  @Index()
  coachId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'coach_id' })
  coach: UserEntity;

  @Column()
  name: string;
}
