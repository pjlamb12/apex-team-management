import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { TagEntity } from './tag.entity';

@Entity('drills')
export class DrillEntity {
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

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'source_url', nullable: true })
  sourceUrl: string;

  @Column({ type: 'jsonb' })
  instructions: any;

  @ManyToMany(() => TagEntity)
  @JoinTable({
    name: 'drill_tags',
    joinColumn: { name: 'drill_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: TagEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
